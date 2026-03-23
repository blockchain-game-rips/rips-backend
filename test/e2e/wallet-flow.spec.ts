import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import path from 'path'
import { AppModule } from 'src/app.module'
import { KmsService } from 'src/application/interfaces/kms.service'
import { EVM_CLIENT_CONFIG } from 'src/infrastructure/evm/evm-client/types'
import { IndexerModule } from 'src/infrastructure/indexer/indexer.module'
import { MnemonicKmsService } from 'src/infrastructure/kms/mnemonic-kms.service'
import {
	KEEPER_PK,
	RIPS_SC_ADDRESS,
} from 'src/infrastructure/rips/rips.constants'
import { UseCaseExceptionFilter } from 'src/presentation/filters/use-case-exception.filter'
import request from 'supertest'
import { createPublicClient, http, parseEther } from 'viem'
import { base } from 'viem/chains'
import { setNativeBalance, useAnvil } from '../utils/anvil'
import { MockIndexerModule } from '../utils/mock-indexer.module'
import { usePostgres } from '../utils/postgres'
import deployments from '../utils/deployments.json'

const KMS_MNEMONIC =
	'spy record fury either collect ill pony monkey praise cool matter state'

const KEEPER_PRIVATE_KEY =
	'0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const ANVIL_STATE_PATH = path.resolve(__dirname, '../utils/anvil-state.json')

const USER_TG_ID = '123456789'
const DEPOSIT_AMOUNT = parseEther('1')
const WITHDRAW_AMOUNT = parseEther('0.1')
const RECIPIENT_ADDRESS = '0x000000000000000000000000000000000000dEaD'

const chain = base

describe('Wallet flow E2E', () => {
	let app: INestApplication
	let publicClient: ReturnType<
		typeof createPublicClient<ReturnType<typeof http>, typeof chain>
	>
	let rpcUrl: string

	usePostgres()
	const anvil = useAnvil({
		chainId: chain.id,
		pathToState: ANVIL_STATE_PATH,
	}).anvils[0]

	beforeAll(async () => {
		rpcUrl = `http://127.0.0.1:${anvil.port}`

		publicClient = createPublicClient({
			chain: chain,
			transport: http(rpcUrl),
		})

		process.env.KMS_MNEMONIC = KMS_MNEMONIC

		const testEvmClientConfig = {
			rpcSettings: {
				[chain.id]: {
					rpcUrls: [rpcUrl],
					disableDefaultRpcUrl: true,
				},
			},
		}

		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(KmsService)
			.useClass(MnemonicKmsService)
			.overrideProvider(EVM_CLIENT_CONFIG)
			.useValue(testEvmClientConfig)
			.overrideModule(IndexerModule)
			.useModule(MockIndexerModule)
			.overrideProvider(RIPS_SC_ADDRESS)
			.useValue(deployments.rips)
			.overrideProvider(KEEPER_PK)
			.useValue(KEEPER_PRIVATE_KEY)
			.compile()

		app = moduleRef.createNestApplication()
		app.useGlobalFilters(new UseCaseExceptionFilter())
		await app.init()
	})

	afterAll(async () => {
		await app?.close()
	})

	it('creates a user and returns an EVM wallet address', async () => {
		const res = await request(app.getHttpServer())
			.post('/users')
			.send({ telegramId: USER_TG_ID })
			.expect(201)

		expect(res.body.wallets['eip155']).toMatch(/^0x[0-9a-fA-F]{40}$/)
	})

	it('deposits funds — balance reflects on-chain transfer', async () => {
		const userRes = await request(app.getHttpServer())
			.get(`/users/${USER_TG_ID}`)
			.expect(200)

		const walletAddress = userRes.body.wallets['eip155']

		await setNativeBalance(publicClient, walletAddress, DEPOSIT_AMOUNT)

		const balanceRes = await request(app.getHttpServer())
			.get(`/users/${USER_TG_ID}/wallet/balance`)
			.expect(200)

		expect(BigInt(balanceRes.body.amount)).toBe(DEPOSIT_AMOUNT)
	})

	it('withdraws funds and sends them on-chain', async () => {
		const recipientBalanceBefore = await publicClient.getBalance({
			address: RECIPIENT_ADDRESS,
		})

		const res = await request(app.getHttpServer())
			.post(`/users/${USER_TG_ID}/wallet/balance/withdraw`)
			.send({
				amount: WITHDRAW_AMOUNT.toString(),
				recipientAddress: RECIPIENT_ADDRESS,
			})
			.expect(201)

		expect(res.body.txId).toMatch(/^0x[0-9a-fA-F]{64}$/)
		expect(typeof res.body.cost.amount).toBe('string')
		expect(typeof res.body.cost.currency.symbol).toBe('string')

		const recipientBalanceAfter = await publicClient.getBalance({
			address: RECIPIENT_ADDRESS,
		})

		expect(recipientBalanceAfter - recipientBalanceBefore).toBe(
			WITHDRAW_AMOUNT,
		)
	})
})
