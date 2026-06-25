import {
	ANVIL_ACCOUNT_0_PRIVATE_KEY,
	ensureIndexerSync,
	getBalances,
} from '@rips/test-harness'
import request from 'supertest'
import { parseEventLogs } from 'viem'
import { KeeperUseCase } from '../../src/application/use-cases/keeper/keeper.use-case'
import { SyncCompletedRipsUseCase } from '../../src/application/use-cases/sync-completed-rips/sync-completed-rips.use-case'
import { EvmAddress } from '../../src/domain/value-objects/evm-address'
import { ripsAbi } from '../../src/infrastructure/rips/rips-abi'
import { SeedCardDefinitionsService } from '../../src/infrastructure/seed/seed-card-definitions.service'
import cardsConfig from '../fixtures/cards.json'
import {
	BALANCE_BUFFER_MULTIPLIER,
	ENTRY_COST,
	NATIVE_CURRENCY_CHAIN_ADDRESS,
} from '../fixtures/entities'
import { useRipsApp } from '../utils/rips-app'
import {
	parseRandomnessFulfilled,
	parseRandomnessRequested,
} from '../utils/rips-events'
import {
	clearCache,
	createUserAndFund,
	fulfillRandomWords,
	getRipsLogs,
} from '../utils/rips-flow'

const PRESET_ID = 1
const ENTRIES_PER_USER = 4

const KEEPER_PRIVATE_KEY = ANVIL_ACCOUNT_0_PRIVATE_KEY

const TELEGRAM_ID_USER_1 = '111222333'
const TELEGRAM_ID_USER_2 = '444555666'

describe('Reveal payouts flow E2E', () => {
	let ripId: number
	let user1Address: EvmAddress
	let user2Address: EvmAddress
	let vrfRequestId: bigint

	const ctx = useRipsApp()

	const entryFunding =
		ENTRY_COST * BigInt(ENTRIES_PER_USER) * BALANCE_BUFFER_MULTIPLIER

	beforeAll(async () => {
		await clearCache(ctx)

		const seedService = ctx.app.get(SeedCardDefinitionsService)
		await seedService.seed(seedService.parseConfig(cardsConfig))
	})

	async function getPayoutClaimedByUser(
		userAddress: EvmAddress,
	): Promise<bigint | undefined> {
		const rawLogs = await getRipsLogs(ctx)

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
		user1Address = await createUserAndFund(
			ctx,
			TELEGRAM_ID_USER_1,
			entryFunding,
		)
		user2Address = await createUserAndFund(
			ctx,
			TELEGRAM_ID_USER_2,
			entryFunding,
		)

		const buyEntriesBody = (entryCount: number) => ({
			presetId: PRESET_ID,
			entryCount,
			paymentCurrencyChainAddress: NATIVE_CURRENCY_CHAIN_ADDRESS,
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

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
	})

	it('keeper requests VRF on the sealed rip', async () => {
		await clearCache(ctx)
		await ctx.app.get(KeeperUseCase).execute()

		const rawLogs = await getRipsLogs(ctx)

		vrfRequestId = parseRandomnessRequested(rawLogs)

		expect(vrfRequestId).toBeDefined()

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
	})

	it('VRF coordinator fulfills randomness and rip is finalized', async () => {
		const fulfillReceipt = await fulfillRandomWords(
			ctx,
			KEEPER_PRIVATE_KEY,
			vrfRequestId,
		)

		const randoms = parseRandomnessFulfilled(fulfillReceipt.logs)

		expect(randoms).toBeDefined()

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
	})

	it('keeper claims payouts and records them in the database', async () => {
		await clearCache(ctx)

		const [user1BalanceBeforeClaim, user2BalanceBeforeClaim] =
			await getBalances([user1Address, user2Address], ctx.publicClient)

		await ctx.app.get(KeeperUseCase).execute()

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
		await clearCache(ctx)

		await ctx.app.get(SyncCompletedRipsUseCase).execute()

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
