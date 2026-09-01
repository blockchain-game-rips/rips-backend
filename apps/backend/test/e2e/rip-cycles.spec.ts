import {
	ANVIL_ACCOUNT_0_PRIVATE_KEY,
	ensureIndexerSync,
} from '@rips/test-harness'
import { parseEventLogs } from 'viem'
import { KeeperUseCase } from '../../src/application/use-cases/keeper/keeper.use-case'
import { SyncSettlingRipsUseCase } from '../../src/application/use-cases/sync-settling-rips/sync-settling-rips.use-case'
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

const FILLING = 'FILLING'

const PRESET_1 = 1
const PRESET_2 = 2

const HALF_CAP = ENTRY_CAP / 2

// The contract hands out rip ids lazily, one per preset that first sees a
// purchase, starting at 1. The deployment creates none, so the scenario below
// produces exactly these ids in this order.
const RIP_1 = 1
const RIP_2 = 2
const RIP_3 = 3

const KEEPER_PRIVATE_KEY = ANVIL_ACCOUNT_0_PRIVATE_KEY

const TELEGRAM_ID_USER_1 = '211222333'
const TELEGRAM_ID_USER_2 = '544555666'
const TELEGRAM_ID_USER_3 = '877888999'

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

describe('Settles rips that finish out of id order', () => {
	const ctx = useRipsApp()

	// Every user funds a full cap on the pricier preset, so no step can run
	// short whichever preset it buys into.
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

	async function settleFilledRip(): Promise<void> {
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
		await clearCache(ctx)
	}

	async function finishedRipIds(): Promise<number[]> {
		const res = await userRequest(ctx.app.getHttpServer())
			.get('/rips/rips/finished')
			.expect(200)

		const body: { rips: { id: number }[] } = res.body

		return body.rips.map((rip) => rip.id)
	}

	async function payoutRipIds(telegramId: string): Promise<number[]> {
		const res = await userRequest(ctx.app.getHttpServer())
			.get('/rips/payouts')
			.set('x-telegram-id', telegramId)
			.expect(200)

		const body: { payouts: { ripId: number }[] } = res.body

		return body.payouts.map((payout) => payout.ripId)
	}

	it('settles the first rip on preset 1', async () => {
		expect(await buyEntries(TELEGRAM_ID_USER_1, PRESET_1, HALF_CAP)).toBe(
			RIP_1,
		)
		expect(await buyEntries(TELEGRAM_ID_USER_2, PRESET_1, HALF_CAP)).toBe(
			RIP_1,
		)

		await settleFilledRip()

		expect(await finishedRipIds()).toEqual([RIP_1])
	})

	it('leaves the second rip on preset 1 half filled', async () => {
		expect(await buyEntries(TELEGRAM_ID_USER_1, PRESET_1, HALF_CAP)).toBe(
			RIP_2,
		)

		await clearCache(ctx)

		const ongoing = await userRequest(ctx.app.getHttpServer())
			.get('/rips/rips/ongoing')
			.expect(200)

		const body: { rips: { id: number; status: string }[] } = ongoing.body

		expect(body.rips.find((rip) => rip.id === RIP_2)?.status).toBe(FILLING)

		expect(await finishedRipIds()).toEqual([RIP_1])
	})

	it('settles the rip on preset 2 while the second rip is still filling', async () => {
		expect(await buyEntries(TELEGRAM_ID_USER_2, PRESET_2, ENTRY_CAP)).toBe(
			RIP_3,
		)

		await settleFilledRip()

		expect(new Set(await finishedRipIds())).toEqual(new Set([RIP_1, RIP_3]))
	})

	it('settles the second rip once it fills behind the newer one', async () => {
		expect(await buyEntries(TELEGRAM_ID_USER_3, PRESET_1, HALF_CAP)).toBe(
			RIP_2,
		)

		await settleFilledRip()

		expect(new Set(await finishedRipIds())).toEqual(
			new Set([RIP_1, RIP_2, RIP_3]),
		)
	})

	it('pays out the late rip to everyone who entered it', async () => {
		expect(await payoutRipIds(TELEGRAM_ID_USER_1)).toContain(RIP_2)
		expect(await payoutRipIds(TELEGRAM_ID_USER_3)).toContain(RIP_2)
	})
})
