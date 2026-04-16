import { Test } from '@nestjs/testing'
import path from 'path'
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
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrum } from 'viem/chains'
import { ZapService } from '../../../src/application/interfaces/zap.service'
import { EIP155 } from '../../../src/constants'
import { Config } from '../../../src/domain/entities/config'
import { UserWallet } from '../../../src/domain/value-objects/wallet'
import { DeBridgeApiService } from '../../../src/infrastructure/de-bridge/de-bridge-api.service'
import { DeBridgeModule } from '../../../src/infrastructure/de-bridge/de-bridge.module'
import { DeBridgeService } from '../../../src/infrastructure/de-bridge/de-bridge.service'
import { EVM_CLIENT_CONFIG } from '../../../src/infrastructure/evm/evm-client/types'
import { NativeCurrency } from '../../../src/infrastructure/evm/primitives/currencies/native-currency'
import { Token } from '../../../src/infrastructure/evm/primitives/currencies/token'
import { ripsAbi } from '../../../src/infrastructure/rips/rips-abi'
import { RIPS_SC_ADDRESS } from '../../../src/infrastructure/rips/rips.constants'
import { SignService } from '../../../src/infrastructure/sign/sign.service'
import { setNativeBalance, setTokenBalance, useAnvil } from '../../utils/anvil'
import { fulfillDlnOrder } from '../../utils/de-bridge-dln'
import {
	createMockDeBridgeApiService,
	mockGetOrder,
} from '../../utils/mock-de-bridge-api.service'
import deployments from '../../utils/state/deployments.json'

const ARBITRUM_CHAIN_ID = 42161
const BASE_CHAIN_ID = 8453

const ANVIL_STATE_PATH = path.resolve(
	__dirname,
	'../../utils/state/anvil-state.json',
)

const USER_PRIVATE_KEY =
	'0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'

const USDC_ARBITRUM_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
const USDC_DECIMALS = 6
const USDC_AMOUNT = parseUnits('20000', USDC_DECIMALS)
const ETH_AMOUNT = parseEther('0.01')

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

const MOCK_CONFIG: Config = {
	id: 1,
	ticketCup: 8,
	feePercent: 1,
	ticketPrice: {
		currency: ETH_BASE,
		amount: parseEther('0.005'),
	},
	durationSeconds: 300,
	prizeDistribution: [],
}

describe('DeBridge integration', () => {
	const { anvils } = useAnvil([
		{
			chainId: ARBITRUM_CHAIN_ID,
			fork: { rpcUrl: 'https://arb1.arbitrum.io/rpc' },
		},
		{
			chainId: BASE_CHAIN_ID,
			fork: { rpcUrl: 'https://base.api.pocket.network' },
			pathToState: ANVIL_STATE_PATH,
		},
	])

	describe('buy tickets with USDC on Arbitrum', () => {
		const userAccount = privateKeyToAccount(USER_PRIVATE_KEY)

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

		let zapService: ZapService
		let debridgeService: DeBridgeService
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
					USDC_AMOUNT,
					arbitrumClient,
				),
				setNativeBalance(
					arbitrumClient,
					userAccount.address,
					ETH_AMOUNT,
				),
			])

			const arbitrumRpcUrl = `http://127.0.0.1:${arbitrumAnvil.port}`
			const baseRpcUrl = `http://127.0.0.1:${baseAnvil.port}`

			mockDeBridgeApiService = createMockDeBridgeApiService()

			const moduleRef = await Test.createTestingModule({
				imports: [DeBridgeModule],
			})
				.overrideProvider(RIPS_SC_ADDRESS)
				.useValue(ripsContractAddress)
				.overrideProvider(EVM_CLIENT_CONFIG)
				.useValue({
					rpcSettings: {
						[ARBITRUM_CHAIN_ID]: {
							rpcUrls: [arbitrumRpcUrl],
							disableDefaultRpcUrl: true,
						},
						[BASE_CHAIN_ID]: {
							rpcUrls: [baseRpcUrl],
							disableDefaultRpcUrl: true,
						},
					},
				})
				.overrideProvider(SignService)
				.useValue(mockSignService)
				.overrideProvider(DeBridgeApiService)
				.useValue(mockDeBridgeApiService)
				.compile()

			zapService = moduleRef.get(ZapService)
			debridgeService = moduleRef.get(DeBridgeService)
		})

		it('fails and refunds full native amount when wrong stake id causes internal call revert', async () => {
			const wrongStakeId = 999
			const ticketCount = 3
			const expectedRefundAmount =
				MOCK_CONFIG.ticketPrice.amount * BigInt(ticketCount)

			const pendingZap = await zapService.buyTickets(userWallet, {
				paymentCurrency: USDC_ARBITRUM,
				stakeId: wrongStakeId,
				config: MOCK_CONFIG,
				ticketCount,
			})

			await fulfillOrderAndMockApi(pendingZap.srcTransaction.id as Hash)

			const result = await debridgeService.getBuyResult(pendingZap)

			if (result === null || result.status !== 'failed')
				throw new Error(
					`result status is not failed, result status: ${result?.status}`,
				)

			expect(result.refund.amount).toBe(expectedRefundAmount)
			expect(result.refund.currency.chainAddress.address).toBe(
				'0x0000000000000000000000000000000000000000',
			)
			expect(result.refund.currency.chainAddress.chain.reference).toBe(
				BASE_CHAIN_ID.toString(),
			)
		})

		it('places order on Arbitrum and fulfills it on Base, buying over ticket cap refunds excess to user', async () => {
			const ticketCap = MOCK_CONFIG.ticketCup
			const overCapTicketCount = ticketCap + 2

			const balanceBefore = await baseClient.getBalance({
				address: userAccount.address,
			})

			// Step 1: place order on Arbitrum with ticket count over cap
			const pendingZap = await zapService.buyTickets(userWallet, {
				paymentCurrency: USDC_ARBITRUM,
				stakeId: 1,
				config: MOCK_CONFIG,
				ticketCount: overCapTicketCount,
			})

			// Step 2: fulfill order on Base and mock API response
			await fulfillOrderAndMockApi(pendingZap.srcTransaction.id as Hash)

			// Step 3: get buy result
			const result = await debridgeService.getBuyResult(pendingZap)

			if (result === null || result.status !== 'success')
				throw new Error(
					`result status is not success, result status: ${result?.status}`,
				)

			const balanceAfter = await baseClient.getBalance({
				address: userAccount.address,
			})

			const excessTickets = BigInt(overCapTicketCount - ticketCap)
			const expectedRefund =
				MOCK_CONFIG.ticketPrice.amount * excessTickets

			expect(result.result.ticketCount).toBe(ticketCap)
			expect(balanceAfter - balanceBefore).toBe(expectedRefund)
			expect(
				await baseClient.readContract({
					address: ripsContractAddress,
					abi: ripsAbi,
					functionName: 'userTicketCount',
					args: [1n, userAccount.address],
				}),
			).toBe(BigInt(ticketCap))
		})

		it('places order on Arbitrum and fulfills it on Base', async () => {
			// Step 1: place order on Arbitrum
			const pendingZap = await zapService.buyTickets(userWallet, {
				paymentCurrency: USDC_ARBITRUM,
				stakeId: 1,
				config: MOCK_CONFIG,
				ticketCount: 5,
			})

			// Step 2: fulfill order on Base and mock API response
			await fulfillOrderAndMockApi(pendingZap.srcTransaction.id as Hash)

			// Step 3: get buy result
			const result = await debridgeService.getBuyResult(pendingZap)

			if (result === null || result.status !== 'success')
				throw new Error(
					`result status is not success, result status: ${result?.status}`,
				)

			const roundId = 2 // roundId 1 is finished in previous test

			expect(result.transaction).toBeDefined()
			expect(result.result.roundId).toBe(roundId)
			expect(result.result.ticketCount).toBe(5)
			expect(
				await baseClient.readContract({
					address: ripsContractAddress,
					abi: ripsAbi,
					functionName: 'userTicketCount',
					args: [BigInt(roundId), userAccount.address],
				}),
			).toBe(5n)
		})

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
})
