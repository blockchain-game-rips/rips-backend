import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { KmsService } from 'src/application/interfaces/kms.service'
import { EIP155 } from 'src/constants'
import { EVM_CLIENT_CONFIG } from 'src/infrastructure/evm/evm-client/types'
import { MnemonicKmsService } from 'src/infrastructure/kms/mnemonic-kms.service'
import { MAIN_CURRENCY_CHAIN_ADDRESS } from 'src/modules/wallets/wallets.constants'
import { UseCaseExceptionFilter } from 'src/presentation/filters/use-case-exception.filter'
import request from 'supertest'
import { createPublicClient, http, parseEther } from 'viem'
import { base } from 'viem/chains'
import { setNativeBalance, useAnvil } from '../utils/anvil'
import { usePostgres } from '../utils/postgres'

const KMS_MNEMONIC =
	'spy record fury either collect ill pony monkey praise cool matter state'

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
	const anvil = useAnvil({ chainId: chain.id }).anvils[0]

	beforeAll(async () => {
		rpcUrl = `http://127.0.0.1:${anvil.port}`

		publicClient = createPublicClient({
			chain: chain,
			transport: http(rpcUrl),
		})

		process.env.KMS_MNEMONIC = KMS_MNEMONIC

		const testMainCurrency = {
			address: '0x0000000000000000000000000000000000000000',
			chain: {
				namespace: EIP155,
				reference: chain.id.toString(),
			},
		}

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
			.overrideProvider(MAIN_CURRENCY_CHAIN_ADDRESS)
			.useValue(testMainCurrency)
			.overrideProvider(EVM_CLIENT_CONFIG)
			.useValue(testEvmClientConfig)
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

		expect(res.body.wallets['eip155']).toMatch(
			'0xCCd27B34d6C1063BFba2Cf2d472588d744270934',
		)
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

		expect(res.body.txHash).toMatch(/^0x[0-9a-fA-F]{64}$/)
		expect(typeof res.body.gasCost).toBe('string')

		const recipientBalanceAfter = await publicClient.getBalance({
			address: RECIPIENT_ADDRESS,
		})

		expect(recipientBalanceAfter - recipientBalanceBefore).toBe(
			WITHDRAW_AMOUNT,
		)
	})
})
