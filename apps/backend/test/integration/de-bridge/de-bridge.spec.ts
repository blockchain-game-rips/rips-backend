import { CacheModule } from '@nestjs/cache-manager'
import { Test, TestingModule } from '@nestjs/testing'
import {
	ANVIL_ACCOUNT_1_PRIVATE_KEY,
	ANVIL_ACCOUNT_2_PRIVATE_KEY,
	ANVIL_MNEMONIC,
	ANVIL_STATE_PATH,
	deployments,
	setNativeBalance,
	setTokenBalance,
	useAnvil,
} from '@rips/test-harness'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
	Chain,
	createPublicClient,
	defineChain,
	getAddress,
	Hash,
	http,
	HttpTransport,
	keccak256,
	parseEther,
	parseSignature,
	parseUnits,
	PublicClient,
	serializeTransaction,
	TransactionSerializableEIP1559,
	zeroAddress,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrum } from 'viem/chains'
import { ZapService } from '../../../src/application/interfaces/zap.service'
import { EIP155 } from '../../../src/constants'
import { Config } from '../../../src/domain/entities/config'
import { ChainAddress } from '../../../src/domain/value-objects/chain-address'
import { CurrencyAmount } from '../../../src/domain/value-objects/currency-amount'
import { UserWallet } from '../../../src/domain/value-objects/wallet'
import {
	OnchainSwapResult,
	PendingZap,
} from '../../../src/domain/value-objects/zap'
import { DeBridgeApiService } from '../../../src/infrastructure/de-bridge/de-bridge-api.service'
import { DeBridgeModule } from '../../../src/infrastructure/de-bridge/de-bridge.module'
import { EVM_CLIENT_CONFIG } from '../../../src/infrastructure/evm/evm-client/types'
import { NativeCurrency } from '../../../src/infrastructure/evm/primitives/currencies/native-currency'
import { Token } from '../../../src/infrastructure/evm/primitives/currencies/token'
import { ripsAbi } from '../../../src/infrastructure/rips/rips-abi'
import { RIPS_CONTRACT } from '../../../src/infrastructure/rips/rips.constants'
import { SignService } from '../../../src/infrastructure/sign/sign.service'
import {
	createMockDeBridgeApiService,
	mockGetOrder,
} from '../../mocks/mock-de-bridge-api.service'
import { fulfillDlnOrder } from '../../utils/de-bridge-dln'

const ARBITRUM_CHAIN_ID = 42161
const BASE_CHAIN_ID = 8453

const USDC_ARBITRUM_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const USDC_DECIMALS = 6

const INITIAL_USDC_BALANCE = parseUnits('20000', USDC_DECIMALS)
const INITIAL_ETH_BALANCE = parseEther('0.01')

const ripsContractAddress = getAddress(deployments.rips)

const baseChain = defineChain({
	id: BASE_CHAIN_ID,
	name: 'Base',
	nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
	rpcUrls: { default: { http: [] } },
})

const ETH_BASE = new NativeCurrency(BASE_CHAIN_ID, {
	symbol: 'ETH',
	name: 'Ether',
	decimals: 18,
})

const USDC_ARBITRUM = new Token(USDC_ARBITRUM_ADDRESS, ARBITRUM_CHAIN_ID, {
	symbol: 'USDC',
	name: 'USD Coin',
	decimals: USDC_DECIMALS,
})

const USDC_BASE = new Token(USDC_BASE_ADDRESS, BASE_CHAIN_ID, {
	symbol: 'USDC',
	name: 'USD Coin',
	decimals: USDC_DECIMALS,
})

const MOCK_CONFIG: Config = {
	id: 1,
	entryCap: 8,
	feeBps: 1,
	entryPrice: {
		currency: ETH_BASE,
		amount: parseEther('0.005'),
	},
	durationSeconds: 300,
	payoutDistribution: [],
}

const userAccount = privateKeyToAccount(ANVIL_ACCOUNT_1_PRIVATE_KEY)
const receiverAccount = privateKeyToAccount(ANVIL_ACCOUNT_2_PRIVATE_KEY)

const userWallet: UserWallet = {
	kind: 'user',
	namespaceToAddress: { [EIP155]: userAccount.address },
}

const mockSignService: Pick<SignService, 'signTx'> = {
	signTx: async (_wallet, tx: TransactionSerializableEIP1559) => {
		const serializedUnsigned = serializeTransaction(tx)
		const hash = keccak256(serializedUnsigned)
		const signatureHex = await userAccount.sign({ hash })
		const signature = parseSignature(signatureHex)
		return serializeTransaction(tx, signature)
	},
}

function toBaseChainAddress(address: `0x${string}`): ChainAddress {
	return {
		address,
		chain: { namespace: EIP155, reference: String(BASE_CHAIN_ID) },
	}
}

function assertNativeFeeOnChain(fee: CurrencyAmount, chainId: number): void {
	expect(fee.amount).toBeGreaterThan(0n)
	expect(fee.currency.chainAddress.address).toBe(zeroAddress)
	expect(fee.currency.chainAddress.chain.reference).toBe(String(chainId))
}

async function buildTestModule(
	rpcSettings: Record<
		number,
		{ rpcUrls: string[]; disableDefaultRpcUrl: boolean }
	>,
	extraProviders: { token: unknown; value: unknown }[] = [],
): Promise<TestingModule> {
	const keyIndexDir = mkdtempSync(join(tmpdir(), 'kms-'))

	process.env.KMS_MNEMONIC = ANVIL_MNEMONIC
	process.env.KMS_LAST_KEY_INDEX_FILE = join(
		keyIndexDir,
		'last-key-index.txt',
	)

	let builder = Test.createTestingModule({
		imports: [CacheModule.register({ isGlobal: true }), DeBridgeModule],
	})
		.overrideProvider(RIPS_CONTRACT)
		.useValue({
			chain: { namespace: EIP155, reference: String(BASE_CHAIN_ID) },
			address: ripsContractAddress,
		})
		.overrideProvider(EVM_CLIENT_CONFIG)
		.useValue({ rpcSettings })
		.overrideProvider(SignService)
		.useValue(mockSignService)

	for (const { token, value } of extraProviders) {
		builder = builder.overrideProvider(token).useValue(value)
	}

	return builder.compile()
}

describe('DeBridge integration', () => {
	const { anvils } = useAnvil([
		{
			chainId: ARBITRUM_CHAIN_ID,
			fork: { rpcUrl: 'https://arb1.arbitrum.io/rpc' },
		},
		{
			chainId: BASE_CHAIN_ID,
			fork: { rpcUrl: 'https://mainnet.base.org' },
			pathToState: ANVIL_STATE_PATH,
		},
	])

	describe('buy entries with USDC on Arbitrum', () => {
		let zapService: ZapService
		let mockDeBridgeApiService: DeBridgeApiService
		let arbitrumClient: PublicClient<HttpTransport, Chain>
		let baseClient: PublicClient<HttpTransport, Chain>

		beforeAll(async () => {
			const [arbitrumAnvil, baseAnvil] = anvils

			arbitrumClient = createPublicClient({
				chain: arbitrum,
				transport: http(`http://127.0.0.1:${arbitrumAnvil.port}`),
			})

			baseClient = createPublicClient({
				chain: baseChain,
				transport: http(`http://127.0.0.1:${baseAnvil.port}`),
			})

			await Promise.all([
				setTokenBalance(
					userAccount.address,
					USDC_ARBITRUM_ADDRESS,
					INITIAL_USDC_BALANCE,
					arbitrumClient,
				),
				setNativeBalance(
					arbitrumClient,
					userAccount.address,
					INITIAL_ETH_BALANCE,
				),
			])

			const arbitrumRpcUrl = `http://127.0.0.1:${arbitrumAnvil.port}`
			const baseRpcUrl = `http://127.0.0.1:${baseAnvil.port}`

			mockDeBridgeApiService = createMockDeBridgeApiService()

			const moduleRef = await buildTestModule(
				{
					[ARBITRUM_CHAIN_ID]: {
						rpcUrls: [arbitrumRpcUrl],
						disableDefaultRpcUrl: true,
					},
					[BASE_CHAIN_ID]: {
						rpcUrls: [baseRpcUrl],
						disableDefaultRpcUrl: true,
					},
				},
				[{ token: DeBridgeApiService, value: mockDeBridgeApiService }],
			)

			zapService = moduleRef.get(ZapService)
		})

		it('fails and refunds full native amount when wrong preset id causes internal call revert', async () => {
			const wrongPresetId = 999
			const entryCount = 3
			const expectedRefundAmount =
				MOCK_CONFIG.entryPrice.amount * BigInt(entryCount)

			const pendingZap = await zapService.buyEntries(userWallet, {
				paymentCurrency: USDC_ARBITRUM,
				presetId: wrongPresetId,
				config: MOCK_CONFIG,
				entryCount,
			})

			await fulfillOrderAndMockApi(pendingZap.srcTransaction.id as Hash)

			const result = await zapService.getBuyResult(pendingZap.zapId)

			if (result === null || result.status !== 'failed')
				throw new Error(
					`result status is not failed, result status: ${result?.status}`,
				)

			expect(result.refund.amount).toBe(expectedRefundAmount)
			expect(result.refund.currency.chainAddress.address).toBe(
				zeroAddress,
			)
			expect(result.refund.currency.chainAddress.chain.reference).toBe(
				BASE_CHAIN_ID.toString(),
			)
		})

		it('places order on Arbitrum and fulfills it on Base, buying over entry cap refunds excess to user', async () => {
			const entryCap = MOCK_CONFIG.entryCap
			const overCapEntryCount = entryCap + 2

			const basBalanceBefore = await baseClient.getBalance({
				address: userAccount.address,
			})

			const usdcBalanceBefore = await readUsdcBalance(userAccount.address)
			const nativeBalanceBefore = await readArbitrumNativeBalance()

			// Step 1: place order on Arbitrum with entry count over cap
			const pendingZap = await zapService.buyEntries(userWallet, {
				paymentCurrency: USDC_ARBITRUM,
				presetId: 1,
				config: MOCK_CONFIG,
				entryCount: overCapEntryCount,
			})

			await assertNativeSpentEqualsFeeAndGas(
				nativeBalanceBefore,
				pendingZap,
			)
			await assertAmountInDeducted(usdcBalanceBefore, pendingZap)

			// Step 2: fulfill order on Base and mock API response
			await fulfillOrderAndMockApi(pendingZap.srcTransaction.id as Hash)

			// Step 3: get buy result
			const result = await zapService.getBuyResult(pendingZap.zapId)

			if (result === null || result.status !== 'success')
				throw new Error(
					`result status is not success, result status: ${result?.status}`,
				)

			const baseBalanceAfter = await baseClient.getBalance({
				address: userAccount.address,
			})

			const excessEntries = BigInt(overCapEntryCount - entryCap)
			const expectedRefund = MOCK_CONFIG.entryPrice.amount * excessEntries

			expect(result.result.entryCount).toBe(entryCap)
			expect(baseBalanceAfter - basBalanceBefore).toBe(expectedRefund)
			expect(
				await baseClient.readContract({
					address: ripsContractAddress,
					abi: ripsAbi,
					functionName: 'userEntryCount',
					args: [1n, userAccount.address],
				}),
			).toBe(BigInt(entryCap))
		})

		it('places order on Arbitrum and fulfills it on Base', async () => {
			const usdcBalanceBefore = await readUsdcBalance(userAccount.address)
			const nativeBalanceBefore = await readArbitrumNativeBalance()

			// Step 1: place order on Arbitrum
			const pendingZap = await zapService.buyEntries(userWallet, {
				paymentCurrency: USDC_ARBITRUM,
				presetId: 1,
				config: MOCK_CONFIG,
				entryCount: 5,
			})

			await assertNativeSpentEqualsFeeAndGas(
				nativeBalanceBefore,
				pendingZap,
			)
			await assertAmountInDeducted(usdcBalanceBefore, pendingZap)

			// Step 2: fulfill order on Base and mock API response
			await fulfillOrderAndMockApi(pendingZap.srcTransaction.id as Hash)

			// Step 3: get buy result
			const result = await zapService.getBuyResult(pendingZap.zapId)

			if (result === null || result.status !== 'success')
				throw new Error(
					`result status is not success, result status: ${result?.status}`,
				)

			const ripId = 2 // ripId 1 is finished in previous test

			expect(result.dstTransaction).toBeDefined()
			expect(result.result.ripId).toBe(ripId)
			expect(result.result.entryCount).toBe(5)
			expect(
				await baseClient.readContract({
					address: ripsContractAddress,
					abi: ripsAbi,
					functionName: 'userEntryCount',
					args: [BigInt(ripId), userAccount.address],
				}),
			).toBe(5n)
		})

		it('swaps USDC on Arbitrum to ETH on Base', async () => {
			const recipient = toBaseChainAddress(receiverAccount.address)

			const receiverBalanceBefore = await baseClient.getBalance({
				address: receiverAccount.address,
			})

			const usdcBalanceBefore = await readUsdcBalance(userAccount.address)
			const nativeBalanceBefore = await readArbitrumNativeBalance()

			const pendingZap = await zapService.swap(userWallet, {
				currencyIn: USDC_ARBITRUM,
				currencyOut: ETH_BASE,
				amountIn: 100_000000n,
				recipient,
			})

			await assertNativeSpentEqualsFeeAndGas(
				nativeBalanceBefore,
				pendingZap,
			)
			await assertAmountInDeducted(usdcBalanceBefore, pendingZap)

			await fulfillOrderAndMockApi(pendingZap.srcTransaction.id as Hash)

			const result = await zapService.getSwapResult(pendingZap.zapId)

			if (result === null || result.status !== 'success')
				throw new Error(
					`result status is not success, result status: ${result?.status}`,
				)

			const receiverBalanceAfter = await baseClient.getBalance({
				address: receiverAccount.address,
			})

			expect(result.result.amountOut.amount).toBeGreaterThan(0n)
			expect(result.result.amountOut.amount).toBe(
				receiverBalanceAfter - receiverBalanceBefore,
			)
			expect(result.result.amountOut.currency.chainAddress.address).toBe(
				zeroAddress,
			)
			expect(
				result.result.amountOut.currency.chainAddress.chain.reference,
			).toBe(String(BASE_CHAIN_ID))
		})

		it('quoteBuyEntries returns amountIn, durationMs and fee in native currency', async () => {
			const result = await zapService.quoteBuyEntries(userWallet, {
				presetId: 1,
				config: MOCK_CONFIG,
				paymentCurrency: USDC_ARBITRUM,
				entryCount: 5,
			})

			expect(result.amountIn.amount).toBeGreaterThan(0n)
			expect(result.amountIn.currency.chainAddress.address).toBe(
				USDC_ARBITRUM.chainAddress.address,
			)
			expect(result.durationMs).toBeGreaterThan(0)
			assertNativeFeeOnChain(result.fee, ARBITRUM_CHAIN_ID)
		})

		it('quoteSwap returns amountOut, durationMs and fee in native currency', async () => {
			const recipient = toBaseChainAddress(userAccount.address)

			const result = await zapService.quoteSwap(userWallet, {
				currencyIn: USDC_ARBITRUM,
				currencyOut: ETH_BASE,
				amountIn: 100_000000n,
				recipient,
			})

			expect(result.amountOut.amount).toBeGreaterThan(0n)
			expect(result.amountOut.currency.chainAddress.address).toBe(
				ETH_BASE.chainAddress.address,
			)
			expect(result.durationMs).toBeGreaterThan(0)
			assertNativeFeeOnChain(result.fee, ARBITRUM_CHAIN_ID)
		})

		async function assertNativeSpentEqualsFeeAndGas(
			nativeBalanceBefore: bigint,
			pendingZap: PendingZap,
		): Promise<void> {
			const nativeBalanceAfter = await readArbitrumNativeBalance()
			const txCost = pendingZap.srcTransaction.cost?.amount ?? 0n
			expect(nativeBalanceBefore - nativeBalanceAfter).toBe(
				pendingZap.fee.amount + txCost,
			)
		}

		async function readArbitrumNativeBalance(): Promise<bigint> {
			return arbitrumClient.getBalance({ address: userAccount.address })
		}

		async function assertAmountInDeducted(
			usdcBalanceBefore: bigint,
			pendingZap: PendingZap,
		): Promise<void> {
			expect(pendingZap.amountIn.amount).toBeGreaterThan(0n)
			expect(pendingZap.amountIn.currency.chainAddress.address).toBe(
				USDC_ARBITRUM.chainAddress.address,
			)
			expect(
				usdcBalanceBefore -
					(await readUsdcBalance(userAccount.address)),
			).toBe(pendingZap.amountIn.amount)
		}

		async function readUsdcBalance(
			address: `0x${string}`,
		): Promise<bigint> {
			return arbitrumClient.readContract({
				address: USDC_ARBITRUM_ADDRESS,
				abi: [
					{
						type: 'function',
						name: 'balanceOf',
						inputs: [{ name: 'account', type: 'address' }],
						outputs: [{ name: '', type: 'uint256' }],
						stateMutability: 'view',
					},
				] as const,
				functionName: 'balanceOf',
				args: [address],
			})
		}

		async function fulfillOrderAndMockApi(srcTxHash: Hash): Promise<void> {
			const fulfillReceipt = await fulfillDlnOrder({
				srcTxHash,
				srcPublicClient: arbitrumClient,
				dstPublicClient: baseClient,
			})

			mockGetOrder(mockDeBridgeApiService, {
				state: 'Fulfilled',
				srcChainId: ARBITRUM_CHAIN_ID,
				dstChainId: BASE_CHAIN_ID,
				srcTxHash,
				dstTxHash: fulfillReceipt.transactionHash,
			})
		}
	})

	describe('swapOnchain USDC to ETH on Base', () => {
		let zapService: ZapService
		let baseClient: PublicClient<HttpTransport, Chain>

		beforeAll(async () => {
			const [, baseAnvil] = anvils

			baseClient = createPublicClient({
				chain: baseChain,
				transport: http(`http://127.0.0.1:${baseAnvil.port}`),
			})

			await Promise.all([
				setTokenBalance(
					userAccount.address,
					USDC_BASE_ADDRESS,
					INITIAL_USDC_BALANCE,
					baseClient,
				),
				setNativeBalance(
					baseClient,
					userAccount.address,
					INITIAL_ETH_BALANCE,
				),
			])

			const baseRpcUrl = `http://127.0.0.1:${baseAnvil.port}`

			const moduleRef = await buildTestModule({
				[BASE_CHAIN_ID]: {
					rpcUrls: [baseRpcUrl],
					disableDefaultRpcUrl: true,
				},
			})

			zapService = moduleRef.get(ZapService)
		})

		it('quoteSwapOnchain returns amountOut and blockchainFee in native currency', async () => {
			const recipient = toBaseChainAddress(userAccount.address)

			const result = await zapService.quoteSwapOnchain(userWallet, {
				currencyIn: USDC_BASE,
				currencyOut: ETH_BASE,
				amountIn: 100_000000n,
				recipient,
			})

			expect(result.amountOut.amount).toBeGreaterThan(0n)
			expect(result.amountOut.currency.chainAddress.address).toBe(
				ETH_BASE.chainAddress.address,
			)
			expect(
				result.transactionQuote.blockchainFee.amount,
			).toBeGreaterThan(0n)
			expect(
				result.transactionQuote.blockchainFee.currency.chainAddress
					.address,
			).toBe(ETH_BASE.chainAddress.address)
		})

		it('swaps USDC on Base to ETH on Base and delivers ETH to recipient', async () => {
			const recipient = toBaseChainAddress(receiverAccount.address)

			const receiverBalanceBefore = await baseClient.getBalance({
				address: receiverAccount.address,
			})

			const result: OnchainSwapResult = await zapService.swapOnchain(
				userWallet,
				{
					currencyIn: USDC_BASE,
					currencyOut: ETH_BASE,
					amountIn: 100_000000n,
					recipient,
				},
			)

			const receiverBalanceAfter = await baseClient.getBalance({
				address: receiverAccount.address,
			})

			expect(result.transaction.id).toMatch(/^0x[0-9a-fA-F]{64}$/)
			expect(result.amountOut.amount).toBeGreaterThan(0n)
			expect(result.amountOut.currency.chainAddress.address).toBe(
				ETH_BASE.chainAddress.address,
			)
			expect(
				receiverBalanceAfter - receiverBalanceBefore,
			).toBeGreaterThan(0n)
		})
	})
})
