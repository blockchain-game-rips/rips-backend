import {
	ANVIL_ACCOUNT_0_PRIVATE_KEY,
	ensureIndexerSync,
} from '@rips/test-harness'
import request from 'supertest'
import { parseEventLogs } from 'viem'
import { KeeperUseCase } from '../../src/application/use-cases/keeper/keeper.use-case'
import { SyncSettlingRipsUseCase } from '../../src/application/use-cases/sync-settling-rips/sync-settling-rips.use-case'
import { EvmAddress } from '../../src/domain/value-objects/evm-address'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
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
	clearCache,
	createUserAndFund,
	fulfillRandomWords,
	getRipsLogs,
} from '../utils/rips-flow'

const PRESET_ID = 1
const ENTRIES_PER_USER = 4
const RIP_CYCLES = 2

const KEEPER_PRIVATE_KEY = ANVIL_ACCOUNT_0_PRIVATE_KEY

const TELEGRAM_ID_USER_1 = '211222333'
const TELEGRAM_ID_USER_2 = '544555666'

type SettledCard = {
	ripId: number
	entryNumber: number
	cardId: bigint
	tier: number
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

describe('Runs two consecutive rip cycles end to end', () => {
	const ctx = useRipsApp()

	const entryFunding =
		ENTRY_COST *
		BigInt(ENTRIES_PER_USER * RIP_CYCLES) *
		BALANCE_BUFFER_MULTIPLIER

	let user1Address: EvmAddress
	let user2Address: EvmAddress

	beforeAll(async () => {
		await clearCache(ctx)

		const seedService = ctx.app.get(SeedCardDefinitionsService)
		await seedService.seed(seedService.parseConfig(cardsConfig))

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
	})

	async function buyEntries(telegramId: string): Promise<number> {
		const res = await request(ctx.app.getHttpServer())
			.post('/rips/entries/purchase')
			.set('x-telegram-id', telegramId)
			.send({
				presetId: PRESET_ID,
				entryCount: ENTRIES_PER_USER,
				paymentCurrencyChainAddress: NATIVE_CURRENCY_CHAIN_ADDRESS,
			})
			.expect(200)

		return res.body.purchase.result.ripId
	}

	async function runRipCycle(): Promise<number> {
		const ripId = await buyEntries(TELEGRAM_ID_USER_1)
		await buyEntries(TELEGRAM_ID_USER_2)

		await ensureIndexerSync(ctx.indexer, ctx.anvil)

		await clearCache(ctx)
		await ctx.app.get(KeeperUseCase).execute()

		const vrfRequestId = latestRandomnessRequestId(await getRipsLogs(ctx))
		await fulfillRandomWords(ctx, KEEPER_PRIVATE_KEY, vrfRequestId)

		await ensureIndexerSync(ctx.indexer, ctx.anvil)

		await clearCache(ctx)
		await ctx.app.get(KeeperUseCase).execute()

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
		await clearCache(ctx)

		await ctx.app.get(SyncSettlingRipsUseCase).execute()

		return ripId
	}

	async function readCards(userAddress: EvmAddress): Promise<SettledCard[]> {
		const prisma = ctx.app.get(PrismaService)

		const rows = await prisma.entryPayout.findMany({
			where: { userAddress },
			orderBy: [{ ripId: 'asc' }, { entryNumber: 'asc' }],
			include: { cardDefinition: true },
		})

		return rows.map((row) => ({
			ripId: row.ripId,
			entryNumber: row.entryNumber,
			cardId: row.cardDefinitionId,
			tier: row.cardDefinition.tier,
		}))
	}

	it('runs two consecutive rip cycles end to end', async () => {
		const ripIds: number[] = []

		for (let cycle = 0; cycle < RIP_CYCLES; cycle++) {
			ripIds.push(await runRipCycle())
		}

		expect(new Set(ripIds).size).toBe(RIP_CYCLES)

		const user1Cards = await readCards(user1Address)

		const byRip = new Map<number, SettledCard[]>()

		for (const card of user1Cards) {
			byRip.set(card.ripId, [...(byRip.get(card.ripId) ?? []), card])
		}

		expect(byRip.size).toBe(RIP_CYCLES)

		for (const cards of byRip.values()) {
			expect(cards.length).toBe(ENTRIES_PER_USER)
			expect(cards.every((c) => c.cardId > 0n)).toBe(true)
		}
	})
})
