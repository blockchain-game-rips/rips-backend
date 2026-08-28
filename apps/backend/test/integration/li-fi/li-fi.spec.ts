import { CacheModule } from '@nestjs/cache-manager'
import { Test, TestingModule } from '@nestjs/testing'
import {
	ANVIL_ACCOUNT_1_PRIVATE_KEY,
	ANVIL_STATE_PATH,
	deployments,
	setNativeBalance,
	setTokenBalance,
} from '@rips/test-harness'
import {
	Chain,
	createPublicClient,
	defineChain,
	erc20Abi,
	getAddress,
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
import { EIP155 } from '../../../src/constants'
import { Config } from '../../../src/domain/entities/config'
import { UserWallet } from '../../../src/domain/value-objects/wallet'
import { CurrencyRegistryModule } from '../../../src/infrastructure/currency-registry/currency-registry.module'
import { EVM_CLIENT_CONFIG } from '../../../src/infrastructure/evm/evm-client/types'
import { NativeCurrency } from '../../../src/infrastructure/evm/primitives/currencies/native-currency'
import { Token } from '../../../src/infrastructure/evm/primitives/currencies/token'
import { LiFiModule } from '../../../src/infrastructure/li-fi/li-fi.module'
import { LiFiService } from '../../../src/infrastructure/li-fi/li-fi.service'
import { ripsAbi } from '../../../src/infrastructure/rips/rips-abi'
import {
	RIPS_CONDUIT_CONTRACT,
	RIPS_CONTRACT,
} from '../../../src/infrastructure/rips/rips.constants'
import { SignService } from '../../../src/infrastructure/sign/sign.service'
import { expectSucceeded } from '../../utils/attempts'
import { anvilTape } from '../../utils/cassette/anvil-tape'
import { externalTapes } from '../../utils/cassette/host-tape'
import { useVcr } from '../../utils/cassette/use-vcr'
import { withAnvilTraces } from '../../utils/cassette/with-traces'
import { provisionKekFile } from '../../utils/kek'
import { usePostgres } from '../../utils/postgres'

const BASE_CHAIN_ID = 8453

const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const USDC_DECIMALS = 6

const SLIPPAGE_SCALE = 10_000

// Entries requested on top of the cap, so the rip has to leave some unsold.
const OVERSHOOT_ENTRIES = 12

const PRESET_ID = 1

// Index of entriesSold in the tuple ripIdToRip returns.
const ENTRIES_SOLD = 3

// Two LI.FI round-trips (each possibly retried), an approval and the swap
// itself exceed the global limit.
const ENTER_TIMEOUT_MS = 120_000

const INITIAL_USDC_BALANCE = parseUnits('20000', USDC_DECIMALS)
const INITIAL_ETH_BALANCE = parseEther('0.05')

const ripsContractAddress = getAddress(deployments.rips)
const ripsConduitContractAddress = getAddress(deployments.conduit)

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

async function buildTestModule(
	rpcSettings: Record<
		number,
		{ rpcUrls: string[]; disableDefaultRpcUrl: boolean }
	>,
): Promise<TestingModule> {
	provisionKekFile()

	return Test.createTestingModule({
		imports: [
			CacheModule.register({ isGlobal: true }),
			CurrencyRegistryModule,
			LiFiModule,
		],
	})
		.overrideProvider(RIPS_CONTRACT)
		.useValue({
			chain: { namespace: EIP155, reference: String(BASE_CHAIN_ID) },
			address: ripsContractAddress,
		})
		.overrideProvider(RIPS_CONDUIT_CONTRACT)
		.useValue({
			chain: { namespace: EIP155, reference: String(BASE_CHAIN_ID) },
			address: ripsConduitContractAddress,
		})
		.overrideProvider(EVM_CLIENT_CONFIG)
		.useValue({ rpcSettings })
		.overrideProvider(SignService)
		.useValue(mockSignService)
		.compile()
}

type SamechainContext = {
	liFiService: LiFiService
	baseClient: PublicClient<HttpTransport, Chain>

	/** Prints anvil's log if the call fails, when there is a log to print. */
	withTraces<T>(run: () => Promise<T>): Promise<T>
}

/**
 * Each test drives a live LI.FI quote against a forked chain, so every one of
 * them gets its own anvil and its own funded wallet. This keeps a failure
 * contained to the test that caused it rather than leaving state behind for
 * the next one.
 */
function useSamechainContext(): SamechainContext {
	const vcr = useVcr({
		...externalTapes(),
		base: anvilTape({
			chainId: BASE_CHAIN_ID,
			fork: { rpcUrl: 'https://mainnet.base.org' },
			pathToState: ANVIL_STATE_PATH,
			printTraces: true,
		}),
	})

	let liFiService: LiFiService
	let baseClient: PublicClient<HttpTransport, Chain>

	const context: SamechainContext = {
		get liFiService() {
			return liFiService
		},
		get baseClient() {
			return baseClient
		},
		withTraces(run) {
			if (vcr.mode === 'replay') {
				return run()
			}

			const { base } = vcr.tapes

			return withAnvilTraces(() => base.logs, run)
		},
	}

	beforeAll(async () => {
		const baseRpcUrl = vcr.tapes.base.rpcUrl

		baseClient = createPublicClient({
			chain: baseChain,
			transport: http(baseRpcUrl),
		})

		// Sequential rather than concurrent: viem stamps a request id when the
		// call is made, so racing these two lands them on the tape out of order.
		await setTokenBalance(
			userAccount.address,
			USDC_BASE_ADDRESS,
			INITIAL_USDC_BALANCE,
			baseClient,
		)

		await setNativeBalance(
			baseClient,
			userAccount.address,
			INITIAL_ETH_BALANCE,
		)

		const moduleRef = await buildTestModule({
			[BASE_CHAIN_ID]: {
				rpcUrls: [baseRpcUrl],
				disableDefaultRpcUrl: true,
			},
		})

		liFiService = moduleRef.get(LiFiService)
	})

	return context
}

describe('LiFi integration', () => {
	// LiFiModule pulls in the Prisma-backed wallet repositories, so the app
	// only boots with a reachable database behind DATABASE_URL.
	usePostgres()

	describe('quoteEnterSamechain with USDC on Base', () => {
		const context = useSamechainContext()

		it('returns amountIn in the payment currency and a native fee', async () => {
			const { liFiService } = context

			const result = await liFiService.quoteEnterSamechain(userWallet, {
				presetId: PRESET_ID,
				config: MOCK_CONFIG,
				paymentCurrency: USDC_BASE,
				entryCount: 2,
			})

			expect(result.amountIn.amount).toBeGreaterThan(0n)
			expect(result.amountIn.currency.chainAddress.address).toBe(
				USDC_BASE.chainAddress.address,
			)

			const { blockchainFee } = result.transactionQuote

			expect(blockchainFee.amount).toBeGreaterThan(0n)
			expect(blockchainFee.currency.chainAddress.address).toBe(
				zeroAddress,
			)
			expect(blockchainFee.currency.chainAddress.chain.reference).toBe(
				String(BASE_CHAIN_ID),
			)
		})
	})

	describe('enterSamechain with USDC on Base', () => {
		const context = useSamechainContext()

		it.only(
			'swaps USDC and buys entries for the user',
			async () => {
				const { liFiService, baseClient } = context

				const entryCount = 2

				const enterArgs = {
					presetId: PRESET_ID,
					config: MOCK_CONFIG,
					paymentCurrency: USDC_BASE,
					entryCount,
				}

				const usdcBalanceBefore = await baseClient.readContract({
					address: USDC_BASE_ADDRESS,
					abi: erc20Abi,
					functionName: 'balanceOf',
					args: [userAccount.address],
				})

				const ethBalanceBefore = await baseClient.getBalance({
					address: userAccount.address,
				})

				const quote = await liFiService.quoteEnterSamechain(
					userWallet,
					enterArgs,
				)

				await context.withTraces(async () => {
					const outcome = await liFiService.enterSamechain(
						userWallet,
						enterArgs,
					)
					const { transaction, result } = expectSucceeded(
						outcome.enter,
					)
					expect(result.purchase.entryCount).toBe(entryCount)
					expect(transaction.chain.reference).toBe(
						String(BASE_CHAIN_ID),
					)

					const usdcBalanceAfter = await baseClient.readContract({
						address: USDC_BASE_ADDRESS,
						abi: erc20Abi,
						functionName: 'balanceOf',
						args: [userAccount.address],
					})

					// The swap spends a fixed input baked into the quote's calldata, so
					// the amount leaving the wallet is exactly what was quoted.
					const spent = usdcBalanceBefore - usdcBalanceAfter

					expect(spent).toBe(quote.amountIn.amount)

					// The entries are paid for out of the swapped USDC, so the only ETH
					// the user parts with is the fee for sending the transaction. The
					// swap overshoots the entry cost to survive a price move, and
					// enterRip refunds that surplus, so the user can only come out ahead
					// of the gas they paid.
					const ethBalanceAfter = await baseClient.getBalance({
						address: userAccount.address,
					})

					// The reported cost omits Base's L1 data fee, so the ETH leaving the
					// wallet is compared against the entry cost it must stay far below
					// rather than against the fee itself.
					const ethSpent = ethBalanceBefore - ethBalanceAfter

					expect(ethSpent).toBeLessThan(
						MOCK_CONFIG.entryPrice.amount * BigInt(entryCount),
					)

					expect(
						await baseClient.readContract({
							address: ripsContractAddress,
							abi: ripsAbi,
							functionName: 'userEntryCount',
							args: [
								BigInt(result.purchase.ripId),
								userAccount.address,
							],
						}),
					).toBe(BigInt(entryCount))
				})
			},
			ENTER_TIMEOUT_MS,
		)
	})

	describe('enterSamechain beyond the cap', () => {
		const context = useSamechainContext()

		it(
			'refunds the entries it could not sell beyond the cap',
			async () => {
				const { liFiService, baseClient } = context

				const ripId = await baseClient.readContract({
					address: ripsContractAddress,
					abi: ripsAbi,
					functionName: 'presetIdToCurrentRipId',
					args: [BigInt(PRESET_ID)],
				})

				const rip = await baseClient.readContract({
					address: ripsContractAddress,
					abi: ripsAbi,
					functionName: 'ripIdToRip',
					args: [ripId],
				})

				const entriesLeft =
					MOCK_CONFIG.entryCap - Number(rip[ENTRIES_SOLD])

				const entryCount = MOCK_CONFIG.entryCap + OVERSHOOT_ENTRIES

				const ethBalanceBefore = await baseClient.getBalance({
					address: userAccount.address,
				})

				const { result } = expectSucceeded(
					(
						await context.withTraces(() =>
							liFiService.enterSamechain(userWallet, {
								presetId: PRESET_ID,
								config: MOCK_CONFIG,
								paymentCurrency: USDC_BASE,
								entryCount,
							}),
						)
					).enter,
				)

				// The swap buys the entry currency for every entry asked for, but the
				// rip only sells what is left under its cap. enterRip refunds the
				// rest, so the user gets back far more than the transaction cost.
				expect(result.purchase.entryCount).toBe(entriesLeft)

				const ethBalanceAfter = await baseClient.getBalance({
					address: userAccount.address,
				})

				const unsoldEntriesCost =
					MOCK_CONFIG.entryPrice.amount *
					BigInt(entryCount - entriesLeft)

				expect(ethBalanceAfter).toBeGreaterThan(ethBalanceBefore)
				expect(ethBalanceAfter - ethBalanceBefore).toBeLessThan(
					unsoldEntriesCost,
				)
			},
			ENTER_TIMEOUT_MS,
		)
	})
})
