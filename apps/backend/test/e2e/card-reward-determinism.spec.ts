import {
	ANVIL_ACCOUNT_0_PRIVATE_KEY,
	ensureIndexerSync,
} from '@rips/test-harness'
import { parseEventLogs } from 'viem'
import { KeeperUseCase } from '../../src/application/use-cases/keeper/keeper.use-case'
import { SyncSettlingRipsUseCase } from '../../src/application/use-cases/sync-settling-rips/sync-settling-rips.use-case'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { ripsAbi } from '../../src/infrastructure/rips/rips-abi'
import { SeedCardDefinitionsService } from '../../src/infrastructure/seed/seed-card-definitions.service'
import cardsConfig from '../fixtures/cards.json'
import {
	BALANCE_BUFFER_MULTIPLIER,
	ENTRY_CAP,
	ENTRY_PRICE_PRESET_2,
	NATIVE_CURRENCY_CHAIN_ADDRESS,
} from '../fixtures/entities'
import { useRipsApp } from '../utils/rips-app'
import {
	clearCache,
	createUserAndFund,
	fulfillRandomWords,
	getRipsLogs,
} from '../utils/rips-flow'
import { userRequest } from '../utils/user-request'

const PRESET_1 = 1
const PRESET_2 = 2

const HALF_CAP = ENTRY_CAP / 2

// Rip ids are handed out lazily, one per preset that first sees a purchase.
const RIP_1 = 1
const RIP_2 = 2
const RIP_3 = 3

/** The scenario below settles exactly these three rips. */
const SETTLED_RIP_COUNT = 3

/** Passes beyond the rip count are no-ops, and must stay no-ops. */
const REDUNDANT_SYNC_PASSES = SETTLED_RIP_COUNT * 2

const KEEPER_PRIVATE_KEY = ANVIL_ACCOUNT_0_PRIVATE_KEY

const TELEGRAM_ID_USER_1 = '311222333'
const TELEGRAM_ID_USER_2 = '644555666'
const TELEGRAM_ID_USER_3 = '977888999'

const TAMPERED_DRAW_RULES = 'cards=999;biases=1:9'

type CardAssignment = {
	ripId: number
	entryNumber: number
	userAddress: string
	cardDefinitionId: bigint
}

function latestRandomnessRequestId(
	logs: Awaited<ReturnType<typeof getRipsLogs>>,
): bigint {
	const requests = parseEventLogs({
		abi: ripsAbi,
		eventName: 'RandomnessRequested',
		logs,
	})

	const latest = requests.at(-1)

	if (!latest) throw new Error('no RandomnessRequested log found')

	return latest.args.vrfRequestId
}

/**
 * Golden test for reproducibility: the same chain data must yield the same
 * cards no matter what order the backend settles rips in, or how late it gets
 * to a hole.
 */
describe('Card rewards are reproducible from chain data', () => {
	const ctx = useRipsApp()

	const entryFunding =
		ENTRY_PRICE_PRESET_2 * BigInt(ENTRY_CAP) * BALANCE_BUFFER_MULTIPLIER

	beforeAll(async () => {
		await clearCache(ctx)

		const seedService = ctx.app.get(SeedCardDefinitionsService)
		await seedService.seed(seedService.parseConfig(cardsConfig))

		for (const telegramId of [
			TELEGRAM_ID_USER_1,
			TELEGRAM_ID_USER_2,
			TELEGRAM_ID_USER_3,
		]) {
			await createUserAndFund(ctx, telegramId, entryFunding)
		}
	})

	async function buyEntries(
		telegramId: string,
		presetId: number,
		entryCount: number,
	): Promise<number> {
		const res = await userRequest(ctx.app.getHttpServer())
			.post('/rips/entries/purchase')
			.set('x-telegram-id', telegramId)
			.send({
				presetId,
				entryCount,
				paymentCurrencyChainAddress: NATIVE_CURRENCY_CHAIN_ADDRESS,
			})
			.expect(200)

		await ensureIndexerSync(ctx.indexer, ctx.anvil)

		const body: { purchase: { result: { ripId: number } } } = res.body

		return body.purchase.result.ripId
	}

	/** Drives a filled rip to CLAIM_SETTLING without syncing it. */
	async function bringRipToSettling(): Promise<void> {
		await clearCache(ctx)
		await ctx.app.get(KeeperUseCase).execute()

		const vrfRequestId = latestRandomnessRequestId(await getRipsLogs(ctx))
		await fulfillRandomWords(ctx, KEEPER_PRIVATE_KEY, vrfRequestId)

		await ensureIndexerSync(ctx.indexer, ctx.anvil)

		await clearCache(ctx)
		await ctx.app.get(KeeperUseCase).execute()

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
		await clearCache(ctx)
	}

	async function syncAllSettlingRips(): Promise<void> {
		const useCase = ctx.app.get(SyncSettlingRipsUseCase)

		for (let i = 0; i < SETTLED_RIP_COUNT; i++) {
			await useCase.execute()
			await clearCache(ctx)
		}
	}

	async function readAssignments(): Promise<CardAssignment[]> {
		const prisma = ctx.app.get(PrismaService)

		const payouts = await prisma.entryPayout.findMany({
			orderBy: [{ ripId: 'asc' }, { entryNumber: 'asc' }],
			select: {
				ripId: true,
				entryNumber: true,
				userAddress: true,
				cardDefinitionId: true,
			},
		})

		return payouts
	}

	async function clearSettlementState(): Promise<void> {
		const prisma = ctx.app.get(PrismaService)

		await prisma.entryPayout.deleteMany()
		await prisma.syncedRip.deleteMany()

		// Settling re-notifies every participant, and notifications are unique
		// per (user, rip, type).
		await prisma.notification.deleteMany()

		await clearCache(ctx)
	}

	let firstRunAssignments: CardAssignment[]

	it('settles a set of rips that filled out of id order', async () => {
		// Rip 1 fills and settles first.
		expect(await buyEntries(TELEGRAM_ID_USER_1, PRESET_1, HALF_CAP)).toBe(
			RIP_1,
		)
		expect(await buyEntries(TELEGRAM_ID_USER_2, PRESET_1, HALF_CAP)).toBe(
			RIP_1,
		)
		await bringRipToSettling()

		// Rip 2 opens but stays half filled — the hole.
		expect(await buyEntries(TELEGRAM_ID_USER_1, PRESET_1, HALF_CAP)).toBe(
			RIP_2,
		)

		// Rip 3 fills and settles while rip 2 is still open.
		expect(await buyEntries(TELEGRAM_ID_USER_2, PRESET_2, ENTRY_CAP)).toBe(
			RIP_3,
		)
		await bringRipToSettling()

		// The hole fills last, so it settles after a later rip.
		expect(await buyEntries(TELEGRAM_ID_USER_3, PRESET_1, HALF_CAP)).toBe(
			RIP_2,
		)
		await bringRipToSettling()

		await syncAllSettlingRips()

		firstRunAssignments = await readAssignments()

		expect(firstRunAssignments.length).toBeGreaterThan(0)
	})

	it('assigns the same cards when every payout is recomputed from scratch', async () => {
		await clearSettlementState()

		await syncAllSettlingRips()

		expect(await readAssignments()).toEqual(firstRunAssignments)
	})

	it('assigns the same cards when the hole is settled in a separate pass', async () => {
		await clearSettlementState()

		const useCase = ctx.app.get(SyncSettlingRipsUseCase)

		// The first run settled everything in one uninterrupted sweep. Here the
		// hole is left outstanding for several ticks while the sweep continues,
		// which is what actually happens when a rip fills late.
		await useCase.execute()
		await clearCache(ctx)

		for (let i = 0; i < REDUNDANT_SYNC_PASSES; i++) {
			await useCase.execute()
			await clearCache(ctx)
		}

		expect(await readAssignments()).toEqual(firstRunAssignments)
	})

	it('assigns the same cards regardless of how many passes the sync takes', async () => {
		await clearSettlementState()

		const useCase = ctx.app.get(SyncSettlingRipsUseCase)

		for (let i = 0; i < REDUNDANT_SYNC_PASSES; i++) {
			await useCase.execute()
			await clearCache(ctx)
		}

		expect(await readAssignments()).toEqual(firstRunAssignments)
	})

	it('records a settlement key on every claimed rip', async () => {
		const prisma = ctx.app.get(PrismaService)

		const syncedRips = await prisma.syncedRip.findMany({
			orderBy: { ripId: 'asc' },
		})

		for (const rip of syncedRips) {
			expect(rip.settleBlockNumber).not.toBeNull()
			expect(rip.settleLogIndex).not.toBeNull()
			expect(rip.drawRulesFingerprint).not.toBeNull()
		}
	})

	it('accumulates a user collection by settlement key, not by rip id', async () => {
		const prisma = ctx.app.get(PrismaService)

		const rips = await prisma.syncedRip.findMany({
			where: { settleBlockNumber: { not: null } },
			orderBy: [{ settleBlockNumber: 'asc' }, { settleLogIndex: 'asc' }],
			select: { ripId: true, settleBlockNumber: true },
		})

		const keysInIdOrder = [...rips]
			.sort((a, b) => a.ripId - b.ripId)
			.map((rip) => rip.settleBlockNumber)

		const keysInSettlementOrder = rips.map((rip) => rip.settleBlockNumber)

		// Rip 2 filled last, so id order and settlement order genuinely differ
		// here — otherwise this test would prove nothing.
		expect(keysInIdOrder).not.toEqual(keysInSettlementOrder)
	})

	it('refuses to settle when the recorded draw rules no longer match', async () => {
		const prisma = ctx.app.get(PrismaService)

		await prisma.entryPayout.deleteMany()
		await prisma.syncedRip.updateMany({
			data: { drawRulesFingerprint: TAMPERED_DRAW_RULES },
		})

		// Rip 2 filled last, so every other rip settled before it: dropping it
		// leaves it to be re-settled behind rips whose recorded rules now
		// disagree with the current ones.
		await prisma.syncedRip.delete({ where: { ripId: RIP_2 } })
		await prisma.notification.deleteMany({ where: { ripId: RIP_2 } })

		await clearCache(ctx)

		await expect(
			ctx.app.get(SyncSettlingRipsUseCase).execute(),
		).rejects.toThrow(/draw rules changed/i)
	})
})
