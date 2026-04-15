import { Test } from '@nestjs/testing'
import path from 'path'
import {
	createPublicClient,
	defineChain,
	Hash,
	http,
	keccak256,
	parseEther,
	parseSignature,
	parseUnits,
	serializeTransaction,
	TransactionSerializableEIP1559,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrum } from 'viem/chains'
import { ZapService } from '../../../src/application/interfaces/zap.service'
import { EIP155 } from '../../../src/constants'
import { Config } from '../../../src/domain/entities/config'
import { UserWallet } from '../../../src/domain/value-objects/wallet'
import { DeBridgeModule } from '../../../src/infrastructure/de-bridge/de-bridge.module'
import { DeBridgeService } from '../../../src/infrastructure/de-bridge/de-bridge.service'
import { EVM_CLIENT_CONFIG } from '../../../src/infrastructure/evm/evm-client/types'
import { NativeCurrency } from '../../../src/infrastructure/evm/primitives/currencies/native-currency'
import { Token } from '../../../src/infrastructure/evm/primitives/currencies/token'
import { RIPS_SC_ADDRESS } from '../../../src/infrastructure/rips/rips.constants'
import { SignService } from '../../../src/infrastructure/sign/sign.service'
import { setNativeBalance, setTokenBalance, useAnvil } from '../../utils/anvil'
import { fulfillDlnOrder } from '../../utils/de-bridge-dln'
import deployments from '../../utils/state/deployments.json'

const ARBITRUM_CHAIN_ID = 42161
const BASE_CHAIN_ID = 8453
const MIN_BLOCK_NUMBER = 1000n

const ANVIL_STATE_PATH = path.resolve(
	__dirname,
	'../../utils/state/anvil-state.json',
)

const USER_PRIVATE_KEY =
	'0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'

const USDC_ARBITRUM_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
const USDC_DECIMALS = 6
const USDC_AMOUNT = parseUnits('200', USDC_DECIMALS)
const ETH_AMOUNT = parseEther('0.01')

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
			fork: {},
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

		beforeAll(async () => {
			const [arbitrumAnvil, baseAnvil] = anvils

			const arbitrumClient = createPublicClient({
				chain: arbitrum,
				transport: http(`http://127.0.0.1:${arbitrumAnvil.port}`),
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

			const moduleRef = await Test.createTestingModule({
				imports: [DeBridgeModule],
			})
				.overrideProvider(RIPS_SC_ADDRESS)
				.useValue(deployments.rips)
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
				.compile()

			zapService = moduleRef.get(ZapService)
			debridgeService = moduleRef.get(DeBridgeService)
		})

		it('places order on Arbitrum and fulfills it on Base', async () => {
			const [arbitrumAnvil, baseAnvil] = anvils

			const arbitrumClient = createPublicClient({
				chain: arbitrum,
				transport: http(`http://127.0.0.1:${arbitrumAnvil.port}`),
			})

			const baseClient = createPublicClient({
				chain: baseChain,
				transport: http(`http://127.0.0.1:${baseAnvil.port}`),
			})

			// Step 1: place order on Arbitrum
			const transaction = await zapService.buyTickets(userWallet, {
				paymentCurrency: USDC_ARBITRUM,
				stakeId: 1,
				config: MOCK_CONFIG,
				ticketCount: 5,
			})

			// Step 2: fulfill order on Base
			const fulfillReceipt = await fulfillDlnOrder({
				srcTxHash: transaction.srcTransaction.id as Hash,
				srcPublicClient: arbitrumClient,
				dstPublicClient: baseClient,
			})

			// Step 4: parse fulfillment result
			const result = await debridgeService.getFulfilledOrderResult(
				fulfillReceipt.transactionHash,
				BASE_CHAIN_ID,
			)

			console.log('Fulfillment result:', result)
		})
	})
})
