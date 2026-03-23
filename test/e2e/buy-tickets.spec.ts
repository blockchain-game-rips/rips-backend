import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import path from 'path'
import { AppModule } from 'src/app.module'
import { KmsService } from 'src/application/interfaces/kms.service'
import { StakeRepository } from 'src/application/interfaces/repositories/stake.repository'
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
import deployments from '../utils/deployments.json'
import { MockIndexerModule } from '../utils/mock-indexer.module'
import { usePostgres } from '../utils/postgres'

const KMS_MNEMONIC =
	'spy record fury either collect ill pony monkey praise cool matter state'

const KEEPER_PRIVATE_KEY =
	'0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const ANVIL_STATE_PATH = path.resolve(__dirname, '../utils/anvil-state.json')

const STAKE_ID = 1
const TICKET_COST = parseEther('0.005')
const TICKET_AMOUNT = 2

const USER_TG_ID = '999888777'

const chain = base

describe('Buy tickets E2E', () => {
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

		const mockStakeRepository: StakeRepository = {
			getStakes: async () => [
				{
					id: STAKE_ID,
					ticketCup: 8,
					ticketPrice: {
						currency: {} as never,
						amount: TICKET_COST,
					},
					durationSeconds: 86400,
				},
			],
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
			.overrideProvider(StakeRepository)
			.useValue(mockStakeRepository)
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

	it('creates a user', async () => {
		const res = await request(app.getHttpServer())
			.post('/users')
			.send({ telegramId: USER_TG_ID })
			.expect(201)

		expect(res.body.wallets['eip155']).toMatch(/^0x[0-9a-fA-F]{40}$/)
	})

	it('buys tickets and returns tx with round and ticket info', async () => {
		const userRes = await request(app.getHttpServer())
			.get(`/users/${USER_TG_ID}`)
			.expect(200)

		const walletAddress = userRes.body.wallets['eip155']
		const requiredBalance = TICKET_COST * BigInt(TICKET_AMOUNT) * 2n

		await setNativeBalance(publicClient, walletAddress, requiredBalance)

		const res = await request(app.getHttpServer())
			.post(`/rips/users/${USER_TG_ID}/buy-tickets`)
			.send({ stakeId: STAKE_ID, amount: TICKET_AMOUNT })
			.expect(201)

		expect(res.body.txId).toMatch(/^0x[0-9a-fA-F]{64}$/)
		expect(res.body.roundId).toBeGreaterThan(0)
		expect(res.body.ticketAmount).toBe(TICKET_AMOUNT)
		expect(typeof res.body.cost.amount).toBe('string')
	})
})
