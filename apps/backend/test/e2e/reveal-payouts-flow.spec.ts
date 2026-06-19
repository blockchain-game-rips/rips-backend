import { Test } from '@nestjs/testing'
import {
	ANVIL_ACCOUNT_0_PRIVATE_KEY,
	deployments,
	getBalances,
	setNativeBalance,
} from '@rips/test-harness'
import request from 'supertest'
import {
	createWalletClient,
	http,
	parseEther,
	parseEventLogs,
	type Address,
	type TransactionReceipt,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { PresetRepository } from '../../src/application/interfaces/repositories/preset.repository'
import { RipRepository } from '../../src/application/interfaces/repositories/rip.repository'
import { GetAvailablePresetsUseCase } from '../../src/application/use-cases/get-available-presets/get-available-presets.use-case'
import { KeeperUseCase } from '../../src/application/use-cases/keeper/keeper.use-case'
import { SyncCompletedRipsUseCase } from '../../src/application/use-cases/sync-completed-rips/sync-completed-rips.use-case'
import { Config } from '../../src/domain/entities/config'
import { Preset } from '../../src/domain/entities/preset'
import {
	CompletedRip,
	OngoingRip,
	RipStatus,
} from '../../src/domain/entities/rip'
import {
	EvmAddress,
	toEvmAddress,
} from '../../src/domain/value-objects/evm-address'
import { IndexerModule } from '../../src/infrastructure/indexer/indexer.module'
import { ripsAbi } from '../../src/infrastructure/rips/rips-abi'
import { SeedCardDefinitionsService } from '../../src/infrastructure/seed/seed-card-definitions.service'
import { SeedModule } from '../../src/infrastructure/seed/seed.module'
import cardsConfig from '../fixtures/cards.json'
import { ANVIL_NATIVE_CURRENCY } from '../fixtures/entities'
import { vrfCoordinatorAbi } from '../fixtures/vrf-coordinator-abi'
import {
	MockIndexerModule,
	MockRipRepository,
} from '../mocks/mock-indexer.module'
import { useRipsApp } from '../utils/rips-app'
import { parseRandomnessFulfilled } from '../utils/rips-events'

const PRESET_ID = 1
const ENTRY_COST = parseEther('0.005')
const ENTRIES_PER_USER = 4
const ENTRY_CAP = 8

const KEEPER_PRIVATE_KEY = ANVIL_ACCOUNT_0_PRIVATE_KEY

const TELEGRAM_ID_USER_1 = '111222333'
const TELEGRAM_ID_USER_2 = '444555666'

describe('Reveal payouts flow E2E', () => {
	let ripId: number
	let user1Address: EvmAddress
	let user2Address: EvmAddress
	let vrfRequestId: bigint
	let randomA: bigint
	let randomB: bigint

	const ripRepository = new MockRipRepository()

	const presetRepository = new (class extends PresetRepository {
		private presetsWithRips: {
			preset: Preset
			ongoingRips: OngoingRip[]
		}[] = []

		setOngoingRips(rips: OngoingRip[]) {
			this.presetsWithRips = [{ preset: PRESET, ongoingRips: rips }]
		}

		setRipSealed(ripId: number) {
			this.setOngoingRips([
				{
					id: ripId,
					preset: PRESET,
					config: PRESET_CONFIG,
					currency: ANVIL_NATIVE_CURRENCY,
					status: RipStatus.SEALED,
					startTime: new Date(),
					actions: { purchases: [], claims: [], refunds: [] },
				},
			])
		}

		setRipClaiming(
			ripId: number,
			purchases: OngoingRip['actions']['purchases'],
			randoms: NonNullable<OngoingRip['randoms']>,
		) {
			this.setOngoingRips([
				{
					id: ripId,
					preset: PRESET,
					config: PRESET_CONFIG,
					currency: ANVIL_NATIVE_CURRENCY,
					status: RipStatus.CLAIMING,
					startTime: new Date(),
					actions: { purchases, claims: [], refunds: [] },
					randoms,
				},
			])
		}

		async getPresetsWithOngoingRips() {
			return Promise.resolve(this.presetsWithRips)
		}
	})()

	const mockGetAvailablePresetsUseCase: Pick<
		GetAvailablePresetsUseCase,
		'execute'
	> = {
		execute: async () =>
			Promise.resolve([
				{
					preset: PRESET,
					fillingRip: {
						id: 1,
						preset: PRESET,
						config: PRESET_CONFIG,
						currency: ANVIL_NATIVE_CURRENCY,
						actions: { purchases: [], claims: [], refunds: [] },
						status: RipStatus.FILLING,
						startTime: new Date(),
					},
				},
				{
					preset: { ...PRESET_2, currentConfig: PRESET_2_CONFIG },
					fillingRip: null,
				},
			]),
	}

	const ctx = useRipsApp((builder) =>
		builder
			.overrideProvider(GetAvailablePresetsUseCase)
			.useValue(mockGetAvailablePresetsUseCase)
			.overrideProvider(PresetRepository)
			.useValue(presetRepository)
			.overrideProvider(RipRepository)
			.useValue(ripRepository),
	)

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [SeedModule],
		})
			.overrideModule(IndexerModule)
			.useModule(MockIndexerModule)
			.overrideProvider(GetAvailablePresetsUseCase)
			.useValue(mockGetAvailablePresetsUseCase)
			.compile()

		const seedApp = moduleRef.createNestApplication()
		await seedApp.init()

		const seedService = seedApp.get(SeedCardDefinitionsService)
		await seedService.seed(seedService.parseConfig(cardsConfig))

		await seedApp.close()
	})

	async function createUserAndFund(telegramId: string): Promise<EvmAddress> {
		await request(ctx.app.getHttpServer())
			.post('/users')
			.send({ telegramId })
			.expect(201)

		const userRes = await request(ctx.app.getHttpServer())
			.get(`/users/${telegramId}`)
			.expect(200)

		const address = toEvmAddress(userRes.body.wallets['eip155'])

		await setNativeBalance(
			ctx.publicClient,
			address,
			ENTRY_COST * BigInt(ENTRIES_PER_USER) * 2n,
		)

		return address
	}

	async function fulfillRandomWords(
		vrfRequestId: bigint,
	): Promise<TransactionReceipt> {
		const { chain, transport } = ctx.publicClient

		const walletClient = createWalletClient({
			account: privateKeyToAccount(KEEPER_PRIVATE_KEY),
			chain,
			transport: http(transport.url),
		})

		const hash = await walletClient.writeContract({
			address: deployments.vrfCoordinator as Address,
			abi: vrfCoordinatorAbi,
			functionName: 'fulfillRandomWords',
			args: [vrfRequestId, deployments.rips as Address],
		})

		const receipt = await ctx.publicClient.waitForTransactionReceipt({
			hash,
		})

		expect(receipt.status).toBe('success')

		return receipt
	}

	async function getPayoutClaimedByUser(
		userAddress: EvmAddress,
	): Promise<bigint | undefined> {
		const rawLogs = await ctx.publicClient.getLogs({
			address: deployments.rips as Address,
			fromBlock: 0n,
		})

		const payoutsClaimed = parseEventLogs({
			abi: ripsAbi,
			eventName: 'PayoutClaimed',
			logs: rawLogs,
		})

		return payoutsClaimed.find(
			(log) => log.args.user?.toLowerCase() === userAddress.toLowerCase(),
		)?.args.payoutAmount
	}

	it('creates two users and buys 4 entries each to fill the rip', async () => {
		user1Address = await createUserAndFund(TELEGRAM_ID_USER_1)
		user2Address = await createUserAndFund(TELEGRAM_ID_USER_2)

		const buyEntriesBody = (entryCount: number) => ({
			presetId: PRESET_ID,
			entryCount,
			paymentCurrencyChainAddress: {
				address: '0x0000000000000000000000000000000000000000',
				chain: { namespace: 'eip155', reference: '31337' },
			},
		})

		const res1 = await request(ctx.app.getHttpServer())
			.post('/rips/entries/purchase')
			.set('x-telegram-id', TELEGRAM_ID_USER_1)
			.send(buyEntriesBody(ENTRIES_PER_USER))
			.expect(201)

		ripId = res1.body.ripId

		expect(res1.body.entryCount).toBe(ENTRIES_PER_USER)

		const res2 = await request(ctx.app.getHttpServer())
			.post('/rips/entries/purchase')
			.set('x-telegram-id', TELEGRAM_ID_USER_2)
			.send(buyEntriesBody(ENTRIES_PER_USER))
			.expect(201)

		expect(res2.body.ripId).toBe(ripId)
		expect(res2.body.entryCount).toBe(ENTRIES_PER_USER)
	})

	it('keeper requests VRF on the sealed rip', async () => {
		presetRepository.setRipSealed(ripId)

		await ctx.app.get(KeeperUseCase).execute()

		presetRepository.setOngoingRips([])

		const rawLogs = await ctx.publicClient.getLogs({
			address: deployments.rips as Address,
			fromBlock: 0n,
		})

		vrfRequestId = parseRandomnessRequested(rawLogs)

		expect(vrfRequestId).toBeDefined()
	})

	it('VRF coordinator fulfills randomness and rip is finalized', async () => {
		const fulfillReceipt = await fulfillRandomWords(vrfRequestId)

		const randoms = parseRandomnessFulfilled(fulfillReceipt.logs)

		expect(randoms).toBeDefined()

		randomA = randoms.randomA
		randomB = randoms.randomB
	})

	it('keeper claims payouts and records them in the database', async () => {
		const purchases: OngoingRip['actions']['purchases'] = [
			{
				userAddress: user1Address,
				entryCount: BigInt(ENTRIES_PER_USER),
				startEntryIndex: 0n,
			},
			{
				userAddress: user2Address,
				entryCount: BigInt(ENTRIES_PER_USER),
				startEntryIndex: BigInt(ENTRIES_PER_USER),
			},
		]

		const randoms = { a: randomA, b: randomB }

		presetRepository.setRipClaiming(ripId, purchases, randoms)

		const claimedRip: CompletedRip = {
			id: ripId,
			preset: PRESET,
			config: PRESET_CONFIG,
			currency: ANVIL_NATIVE_CURRENCY,
			status: RipStatus.CLAIMED,
			startTime: new Date(),
			actions: { purchases, claims: [], refunds: [] },
			randoms,
		}

		const [user1BalanceBeforeClaim, user2BalanceBeforeClaim] =
			await getBalances([user1Address, user2Address], ctx.publicClient)

		await ctx.app.get(KeeperUseCase).execute()

		presetRepository.setOngoingRips([])

		ripRepository.setNextCompletedRip(claimedRip)
		await ctx.app.get(SyncCompletedRipsUseCase).execute()
		ripRepository.setNextCompletedRip(null)

		const user1OnChainPayout = await getPayoutClaimedByUser(user1Address)
		const user2OnChainPayout = await getPayoutClaimedByUser(user2Address)

		expect(user1OnChainPayout).toBeDefined()
		expect(user2OnChainPayout).toBeDefined()

		const [user1BalanceAfterClaim, user2BalanceAfterClaim] =
			await getBalances([user1Address, user2Address], ctx.publicClient)

		expect(user1BalanceAfterClaim - user1BalanceBeforeClaim).toBe(
			user1OnChainPayout ?? 0n,
		)
		expect(user2BalanceAfterClaim - user2BalanceBeforeClaim).toBe(
			user2OnChainPayout ?? 0n,
		)
	})

	it('get-unrevealed-payouts returns 4 entries for each user', async () => {
		const res1 = await request(ctx.app.getHttpServer())
			.get('/rips/payouts')
			.set('x-telegram-id', TELEGRAM_ID_USER_1)
			.expect(200)

		const res2 = await request(ctx.app.getHttpServer())
			.get('/rips/payouts')
			.set('x-telegram-id', TELEGRAM_ID_USER_2)
			.expect(200)

		expect(res1.body.payouts).toHaveLength(ENTRIES_PER_USER)
		expect(res2.body.payouts).toHaveLength(ENTRIES_PER_USER)
	})

	it('user 1 reveals 1 entry, user 2 reveals all 4 entries', async () => {
		const revealOneRes = await request(ctx.app.getHttpServer())
			.patch('/rips/payouts')
			.set('x-telegram-id', TELEGRAM_ID_USER_1)
			.send({ revealAll: false })
			.expect(200)

		expect(revealOneRes.body.payouts).toHaveLength(1)

		const revealAllRes = await request(ctx.app.getHttpServer())
			.patch('/rips/payouts')
			.set('x-telegram-id', TELEGRAM_ID_USER_2)
			.send({ revealAll: true })
			.expect(200)

		expect(revealAllRes.body.payouts).toHaveLength(ENTRIES_PER_USER)
	})

	it('user 1 has 3 unrevealed entries remaining, user 2 has 0', async () => {
		const res1 = await request(ctx.app.getHttpServer())
			.get('/rips/payouts')
			.set('x-telegram-id', TELEGRAM_ID_USER_1)
			.expect(200)

		const res2 = await request(ctx.app.getHttpServer())
			.get('/rips/payouts')
			.set('x-telegram-id', TELEGRAM_ID_USER_2)
			.expect(200)

		expect(res1.body.payouts).toHaveLength(ENTRIES_PER_USER - 1)
		expect(res2.body.payouts).toHaveLength(0)
	})
})

const PRESET_CONFIG: Config = {
	id: 1,
	entryCap: ENTRY_CAP,
	feePercent: 0,
	entryPrice: {
		currency: ANVIL_NATIVE_CURRENCY,
		amount: ENTRY_COST,
	},
	durationSeconds: 300,
	payoutDistribution: [
		{
			payoutCount: 5n,
			minPayout: parseEther('0.0008'),
			maxPayout: parseEther('0.0012'),
		},
		{
			payoutCount: 2n,
			minPayout: parseEther('0.007'),
			maxPayout: parseEther('0.008'),
		},
		{
			payoutCount: 1n,
			minPayout: parseEther('0.018'),
			maxPayout: parseEther('0.018'),
		},
	],
}

const PRESET_2_CONFIG: Config = {
	id: 2,
	entryCap: ENTRY_CAP,
	feePercent: 0,
	entryPrice: {
		currency: ANVIL_NATIVE_CURRENCY,
		amount: parseEther('0.01'),
	},
	durationSeconds: 300,
	payoutDistribution: [
		{
			payoutCount: 5n,
			minPayout: parseEther('0.0016'),
			maxPayout: parseEther('0.0024'),
		},
		{
			payoutCount: 2n,
			minPayout: parseEther('0.014'),
			maxPayout: parseEther('0.016'),
		},
		{
			payoutCount: 1n,
			minPayout: parseEther('0.036'),
			maxPayout: parseEther('0.036'),
		},
	],
}

const PRESET: Preset = {
	id: PRESET_ID,
	currentConfig: PRESET_CONFIG,
}

const PRESET_2: Preset = {
	id: 2,
	currentConfig: PRESET_2_CONFIG,
}

function parseRandomnessRequested(logs: TransactionReceipt['logs']): bigint {
	const [log] = parseEventLogs({
		abi: ripsAbi,
		eventName: 'RandomnessRequested',
		logs,
	})
	return log.args.vrfRequestId
}
