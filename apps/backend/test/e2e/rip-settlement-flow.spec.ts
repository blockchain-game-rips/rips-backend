import {
	ANVIL_ACCOUNT_0_PRIVATE_KEY,
	deployments,
	ensureIndexerSync,
	getBalances,
	increaseTime,
} from '@rips/test-harness'
import request from 'supertest'
import { getAddress, parseEventLogs } from 'viem'
import { NotificationType } from '../../generated/prisma'
import { KeeperUseCase } from '../../src/application/use-cases/keeper/keeper.use-case'
import { SyncSettlingRipsUseCase } from '../../src/application/use-cases/sync-settling-rips/sync-settling-rips.use-case'
import { EvmAddress } from '../../src/domain/value-objects/evm-address'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { ripsAbi } from '../../src/infrastructure/rips/rips-abi'
import { SeedCardDefinitionsService } from '../../src/infrastructure/seed/seed-card-definitions.service'
import { MAX_LIMIT } from '../../src/presentation/rips/get-finished-rips/get-finished-rips.request'
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
const ENTRIES_PER_USER_FIRST_PURCHASE = 2
const ENTRIES_PER_USER_SECOND_PURCHASE =
	ENTRIES_PER_USER - ENTRIES_PER_USER_FIRST_PURCHASE
const ENTRIES_REVEALED_ONE_AT_A_TIME = 1

const KEEPER_PRIVATE_KEY = ANVIL_ACCOUNT_0_PRIVATE_KEY

const TELEGRAM_ID_USER_1 = '111222333'
const TELEGRAM_ID_USER_2 = '444555666'

const REFUND_TELEGRAM_ID_USER_1 = '777888999'
const REFUND_TELEGRAM_ID_USER_2 = '101112131'

const ENTRIES_PER_REFUND_USER = 1

const NEVER_PARTICIPATED_ADDRESS = '0x000000000000000000000000000000000000dEaD'

// Each user in this flow enters exactly one rip, so their finished counts are
// exact rather than lower bounds.
const NO_RIPS = 0
const CLAIMED_RIPS_PER_PARTICIPANT = 1
const REFUNDED_RIPS_PER_PARTICIPANT = 1

describe('Rip settlement flow E2E', () => {
	const RIPS_ADDRESS = getAddress(deployments.rips)

	let ripId: number
	let user1Address: EvmAddress
	let user2Address: EvmAddress
	let vrfRequestId: bigint

	let balancesBeforeClaim: bigint[]

	let refundRipId: number
	let refundUser1Address: EvmAddress

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

		// Split across two purchases so the participation lookup has to
		// collapse duplicate rows for the same user and rip.
		const res1 = await request(ctx.app.getHttpServer())
			.post('/rips/entries/purchase')
			.set('x-telegram-id', TELEGRAM_ID_USER_1)
			.send(buyEntriesBody(ENTRIES_PER_USER_FIRST_PURCHASE))
			.expect(201)

		ripId = res1.body.ripId

		expect(res1.body.entryCount).toBe(ENTRIES_PER_USER_FIRST_PURCHASE)

		const res1SecondPurchase = await request(ctx.app.getHttpServer())
			.post('/rips/entries/purchase')
			.set('x-telegram-id', TELEGRAM_ID_USER_1)
			.send(buyEntriesBody(ENTRIES_PER_USER_SECOND_PURCHASE))
			.expect(201)

		expect(res1SecondPurchase.body.ripId).toBe(ripId)
		expect(res1SecondPurchase.body.entryCount).toBe(
			ENTRIES_PER_USER_SECOND_PURCHASE,
		)

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

	it('keeper claims payouts on chain', async () => {
		await clearCache(ctx)

		balancesBeforeClaim = await getBalances(
			[user1Address, user2Address],
			ctx.publicClient,
		)

		await ctx.app.get(KeeperUseCase).execute()

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
		await clearCache(ctx)
	})

	it('reports the claimed-but-unsynced rip as CLAIM_SETTLING in ongoing', async () => {
		const res = await request(ctx.app.getHttpServer())
			.get('/rips/rips/ongoing')
			.expect(200)

		const settlingRip = res.body.rips.find(
			(rip: { id: number }) => rip.id === ripId,
		)

		expect(settlingRip).toBeDefined()
		expect(settlingRip.status).toBe('CLAIM_SETTLING')
	})

	it('omits the settling rip from the finished feed', async () => {
		const res = await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished')
			.expect(200)

		expect(
			res.body.rips.some((rip: { id: number }) => rip.id === ripId),
		).toBe(false)
	})

	// Counted only once the backend has settled the rip, not once the chain
	// has finished with it. The sync worker has not run yet.
	it('leaves the settling rip out of a participant count', async () => {
		const res = await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished/counts')
			.query({ userAddress: user1Address })
			.expect(200)

		expect(res.body).toEqual({ claimed: NO_RIPS, refunded: NO_RIPS })
	})

	it('records the payouts once the sync worker handles the rip', async () => {
		const [user1BalanceBeforeClaim, user2BalanceBeforeClaim] =
			balancesBeforeClaim

		await ctx.app.get(SyncSettlingRipsUseCase).execute()

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

	it('moves the synced rip out of ongoing and into finished as CLAIMED', async () => {
		await clearCache(ctx)

		const ongoingRes = await request(ctx.app.getHttpServer())
			.get('/rips/rips/ongoing')
			.expect(200)

		expect(
			ongoingRes.body.rips.some(
				(rip: { id: number }) => rip.id === ripId,
			),
		).toBe(false)

		const finishedRes = await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished')
			.expect(200)

		const finishedRip = finishedRes.body.rips.find(
			(rip: { id: number }) => rip.id === ripId,
		)

		expect(finishedRip).toBeDefined()
		expect(finishedRip.status).toBe('CLAIMED')
	})

	it('rejects a malformed cursor on the finished feed', async () => {
		await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished')
			.query({ cursor: 'not-a-cursor' })
			.expect(400)
	})

	it('rejects a limit above the maximum', async () => {
		await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished')
			.query({ limit: MAX_LIMIT + 1 })
			.expect(400)
	})

	it('pages the finished feed with the returned cursor', async () => {
		const firstPage = await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished')
			.query({ limit: 1 })
			.expect(200)

		expect(firstPage.body.rips).toHaveLength(1)

		if (firstPage.body.nextCursor == null) {
			return
		}

		const secondPage = await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished')
			.query({ limit: 1, cursor: firstPage.body.nextCursor })
			.expect(200)

		const firstIds = firstPage.body.rips.map(
			(rip: { id: number }) => rip.id,
		)
		const secondIds = secondPage.body.rips.map(
			(rip: { id: number }) => rip.id,
		)

		expect(secondIds).not.toEqual(expect.arrayContaining(firstIds))
	})

	it('get-payouts returns 4 entries for each user', async () => {
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

		expect(revealOneRes.body.payouts).toHaveLength(
			ENTRIES_REVEALED_ONE_AT_A_TIME,
		)

		const revealAllRes = await request(ctx.app.getHttpServer())
			.patch('/rips/payouts')
			.set('x-telegram-id', TELEGRAM_ID_USER_2)
			.send({ revealAll: true })
			.expect(200)

		expect(revealAllRes.body.payouts).toHaveLength(ENTRIES_PER_USER)
	})

	it('user 1 has 3 unrevealed entries remaining, user 2 has 0', async () => {
		const res1 = await request(ctx.app.getHttpServer())
			.get('/rips/payouts?revealed=false')
			.set('x-telegram-id', TELEGRAM_ID_USER_1)
			.expect(200)

		const res2 = await request(ctx.app.getHttpServer())
			.get('/rips/payouts?revealed=false')
			.set('x-telegram-id', TELEGRAM_ID_USER_2)
			.expect(200)

		expect(res1.body.payouts).toHaveLength(ENTRIES_PER_USER - 1)
		expect(res2.body.payouts).toHaveLength(0)
	})

	it('revealed filter returns the mirror image of unrevealed', async () => {
		const res1 = await request(ctx.app.getHttpServer())
			.get('/rips/payouts?revealed=true')
			.set('x-telegram-id', TELEGRAM_ID_USER_1)
			.expect(200)

		const res2 = await request(ctx.app.getHttpServer())
			.get('/rips/payouts?revealed=true')
			.set('x-telegram-id', TELEGRAM_ID_USER_2)
			.expect(200)

		expect(res1.body.payouts).toHaveLength(ENTRIES_REVEALED_ONE_AT_A_TIME)
		expect(res2.body.payouts).toHaveLength(ENTRIES_PER_USER)
	})

	it('unfiltered call returns all payouts regardless of reveal state', async () => {
		const res = await request(ctx.app.getHttpServer())
			.get('/rips/payouts')
			.set('x-telegram-id', TELEGRAM_ID_USER_1)
			.expect(200)

		expect(res.body.payouts).toHaveLength(ENTRIES_PER_USER)
		expect(
			res.body.payouts.filter((p: { revealed: boolean }) => p.revealed),
		).toHaveLength(ENTRIES_REVEALED_ONE_AT_A_TIME)
	})

	it('ripId filter returns both reveal states for that rip', async () => {
		const allRes = await request(ctx.app.getHttpServer())
			.get('/rips/payouts')
			.set('x-telegram-id', TELEGRAM_ID_USER_1)
			.expect(200)

		const ripId: number = allRes.body.payouts[0].ripId

		const ripRes = await request(ctx.app.getHttpServer())
			.get(`/rips/payouts?ripId=${ripId}`)
			.set('x-telegram-id', TELEGRAM_ID_USER_1)
			.expect(200)

		expect(ripRes.body.payouts.length).toBeGreaterThan(0)
		expect(
			ripRes.body.payouts.every(
				(p: { ripId: number }) => p.ripId === ripId,
			),
		).toBe(true)
	})

	it('rejects a malformed ripId', async () => {
		await request(ctx.app.getHttpServer())
			.get('/rips/payouts?ripId=abc')
			.set('x-telegram-id', TELEGRAM_ID_USER_1)
			.expect(400)
	})

	async function getPresetConfig(): Promise<{
		entryCap: bigint
		duration: number
	}> {
		const configId = await ctx.publicClient.readContract({
			address: RIPS_ADDRESS,
			abi: ripsAbi,
			functionName: 'presetIdToCurrentConfigId',
			args: [BigInt(PRESET_ID)],
		})

		const [, entryCap, duration] = await ctx.publicClient.readContract({
			address: RIPS_ADDRESS,
			abi: ripsAbi,
			functionName: 'configIdToConfig',
			args: [configId],
		})

		return { entryCap, duration }
	}

	it('buys fewer entries than the cap so a new rip cannot fill', async () => {
		const { entryCap } = await getPresetConfig()

		const totalEntries = ENTRIES_PER_REFUND_USER * 2

		expect(totalEntries).toBeLessThan(Number(entryCap))

		const entryFunding =
			ENTRY_COST *
			BigInt(ENTRIES_PER_REFUND_USER) *
			BALANCE_BUFFER_MULTIPLIER

		refundUser1Address = await createUserAndFund(
			ctx,
			REFUND_TELEGRAM_ID_USER_1,
			entryFunding,
		)
		await createUserAndFund(ctx, REFUND_TELEGRAM_ID_USER_2, entryFunding)

		const buyEntriesBody = (entryCount: number) => ({
			presetId: PRESET_ID,
			entryCount,
			paymentCurrencyChainAddress: NATIVE_CURRENCY_CHAIN_ADDRESS,
		})

		const res1 = await request(ctx.app.getHttpServer())
			.post('/rips/entries/purchase')
			.set('x-telegram-id', REFUND_TELEGRAM_ID_USER_1)
			.send(buyEntriesBody(ENTRIES_PER_REFUND_USER))
			.expect(201)

		const res2 = await request(ctx.app.getHttpServer())
			.post('/rips/entries/purchase')
			.set('x-telegram-id', REFUND_TELEGRAM_ID_USER_2)
			.send(buyEntriesBody(ENTRIES_PER_REFUND_USER))
			.expect(201)

		refundRipId = res1.body.ripId

		expect(res2.body.ripId).toBe(refundRipId)
		expect(refundRipId).not.toBe(ripId)

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
	})

	it('keeper refunds the expired rip and records refunds in the database', async () => {
		const { duration } = await getPresetConfig()

		await increaseTime(ctx.publicClient, duration + 1)

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
		await clearCache(ctx)

		const balanceBeforeRefund = (
			await getBalances([refundUser1Address], ctx.publicClient)
		)[0]

		await ctx.app.get(KeeperUseCase).execute()

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
		await clearCache(ctx)

		await ctx.app.get(SyncSettlingRipsUseCase).execute()

		const balanceAfterRefund = (
			await getBalances([refundUser1Address], ctx.publicClient)
		)[0]

		expect(balanceAfterRefund).toBeGreaterThan(balanceBeforeRefund)

		const prisma = ctx.app.get(PrismaService)

		const notifications = await prisma.notification.findMany({
			where: { ripId: refundRipId },
		})
		const syncedRips = await prisma.syncedRip.findMany({
			where: { ripId: refundRipId },
		})

		expect(notifications.length).toBeGreaterThan(0)
		expect(
			notifications.every((n) => n.type === NotificationType.REFUNDED),
		).toBe(true)

		expect(syncedRips).toHaveLength(1)
		expect(syncedRips[0].ripId).toBe(refundRipId)
	})

	it('narrows the finished feed to the rips a user entered', async () => {
		const res = await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished')
			.query({ userAddress: user1Address })
			.expect(200)

		const ids = res.body.rips.map((rip: { id: number }) => rip.id)

		expect(ids).toContain(ripId)
		expect(ids).not.toContain(refundRipId)
	})

	it('narrows the finished feed to a refund-rip participant', async () => {
		const res = await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished')
			.query({ userAddress: refundUser1Address })
			.expect(200)

		const ids = res.body.rips.map((rip: { id: number }) => rip.id)

		expect(ids).toContain(refundRipId)
		expect(ids).not.toContain(ripId)
	})

	it('returns every finished rip when no user address is given', async () => {
		const res = await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished')
			.expect(200)

		const ids = res.body.rips.map((rip: { id: number }) => rip.id)

		expect(ids).toContain(ripId)
		expect(ids).toContain(refundRipId)
	})

	it('returns an empty page for an address that entered nothing', async () => {
		const res = await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished')
			.query({ userAddress: NEVER_PARTICIPATED_ADDRESS })
			.expect(200)

		expect(res.body.rips).toHaveLength(0)
		expect(res.body.nextCursor).toBeNull()
	})

	// User 1 bought entries in two separate purchases, so a participation
	// lookup that failed to collapse them would page as if there were more
	// rips than exist and hand back a cursor promising a further page.
	it('pages a filtered feed without inventing a page that is not there', async () => {
		const res = await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished')
			.query({ userAddress: user1Address, limit: 1 })
			.expect(200)

		expect(res.body.rips).toHaveLength(1)
		expect(res.body.rips[0].id).toBe(ripId)

		if (res.body.nextCursor == null) {
			return
		}

		const secondPage = await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished')
			.query({
				userAddress: user1Address,
				limit: 1,
				cursor: res.body.nextCursor,
			})
			.expect(200)

		expect(secondPage.body.rips).toHaveLength(0)
		expect(secondPage.body.nextCursor).toBeNull()
	})

	it('rejects a malformed user address on the finished feed', async () => {
		await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished')
			.query({ userAddress: 'not-an-address' })
			.expect(400)
	})

	it('matches a user address regardless of its casing', async () => {
		const res = await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished')
			.query({ userAddress: user1Address.toLowerCase() })
			.expect(200)

		const ids = res.body.rips.map((rip: { id: number }) => rip.id)

		expect(ids).toContain(ripId)
	})

	it('counts a claim-rip participant against the claimed total', async () => {
		const res = await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished/counts')
			.query({ userAddress: user1Address })
			.expect(200)

		expect(res.body).toEqual({
			claimed: CLAIMED_RIPS_PER_PARTICIPANT,
			refunded: NO_RIPS,
		})
	})

	it('counts a refund-rip participant against the refunded total', async () => {
		const res = await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished/counts')
			.query({ userAddress: refundUser1Address })
			.expect(200)

		expect(res.body).toEqual({
			claimed: NO_RIPS,
			refunded: REFUNDED_RIPS_PER_PARTICIPANT,
		})
	})

	it('counts nothing for an address that entered nothing', async () => {
		const res = await request(ctx.app.getHttpServer())
			.get('/rips/rips/finished/counts')
			.query({ userAddress: NEVER_PARTICIPATED_ADDRESS })
			.expect(200)

		expect(res.body).toEqual({ claimed: NO_RIPS, refunded: NO_RIPS })
	})
})
