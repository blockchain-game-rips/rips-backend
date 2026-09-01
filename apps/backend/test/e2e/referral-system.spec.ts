import {
	ANVIL_ACCOUNT_0_PRIVATE_KEY,
	ensureIndexerSync,
	getBalances,
	setNativeBalance,
} from '@rips/test-harness'
import { parseEventLogs } from 'viem'
import { KeeperUseCase } from '../../src/application/use-cases/keeper/keeper.use-case'
import { SyncSettlingRipsUseCase } from '../../src/application/use-cases/sync-settling-rips/sync-settling-rips.use-case'
import {
	EvmAddress,
	toEvmAddress,
} from '../../src/domain/value-objects/evm-address'
import { ripsAbi } from '../../src/infrastructure/rips/rips-abi'
import { SeedCardDefinitionsService } from '../../src/infrastructure/seed/seed-card-definitions.service'
import cardsConfig from '../fixtures/cards.json'
import {
	BALANCE_BUFFER_MULTIPLIER,
	ENTRY_PRICE_PRESET_1,
	NATIVE_ADDRESS,
	NATIVE_CURRENCY_CHAIN_ADDRESS,
} from '../fixtures/entities'
import { useRipsApp } from '../utils/rips-app'
import {
	parseRandomnessFulfilled,
	parseRandomnessRequested,
} from '../utils/rips-events'
import { clearCache, fulfillRandomWords, getRipsLogs } from '../utils/rips-flow'
import { userRequest } from '../utils/user-request'

const PRESET_ID = 1
const ENTRIES_PER_USER = 4

const KEEPER_PRIVATE_KEY = ANVIL_ACCOUNT_0_PRIVATE_KEY

const TELEGRAM_ID_REFERRER = '100200300'
const TELEGRAM_ID_PLAYER = '400500600'

const DEPLOYED_DEFAULT_REFERRAL_FEE_BPS = 2000

describe('Referral system E2E', () => {
	let referrerAddress: EvmAddress
	let playerAddress: EvmAddress
	let availableReward: bigint

	const ctx = useRipsApp()

	beforeAll(async () => {
		await clearCache(ctx)

		const seedService = ctx.app.get(SeedCardDefinitionsService)
		await seedService.seed(seedService.parseConfig(cardsConfig))
	})

	it('reports the default fee in the tier table when no tiers are configured', async () => {
		const res = await userRequest(ctx.app.getHttpServer())
			.get('/referral-system/tier-tables')
			.expect(200)

		expect(res.body.tierTables).toHaveLength(1)

		const [table] = res.body.tierTables

		expect(table.defaultFeeBps).toBe(DEPLOYED_DEFAULT_REFERRAL_FEE_BPS)
		expect(table.tiers).toEqual([])
	})

	it('creates referrer user', async () => {
		const res = await userRequest(ctx.app.getHttpServer())
			.post('/users')
			.send({ telegramId: TELEGRAM_ID_REFERRER })
			.expect(201)

		referrerAddress = toEvmAddress(res.body.wallets['eip155'])

		expect(referrerAddress).toMatch(/^0x[0-9a-fA-F]{40}$/)
	})

	it('creates player user linked to referrer', async () => {
		const res = await userRequest(ctx.app.getHttpServer())
			.post('/users')
			.send({ telegramId: TELEGRAM_ID_PLAYER, referrerAddress })
			.expect(201)

		expect(res.body.referrerAddress).toBe(referrerAddress)
	})

	async function runGameCycle(): Promise<void> {
		const referrerRes = await userRequest(ctx.app.getHttpServer())
			.get(`/users/${TELEGRAM_ID_REFERRER}`)
			.expect(200)

		const playerRes = await userRequest(ctx.app.getHttpServer())
			.get(`/users/${TELEGRAM_ID_PLAYER}`)
			.expect(200)

		playerAddress = toEvmAddress(playerRes.body.wallets['eip155'])

		const entryBalance =
			ENTRY_PRICE_PRESET_1 *
			BigInt(ENTRIES_PER_USER) *
			BALANCE_BUFFER_MULTIPLIER

		await setNativeBalance(
			ctx.publicClient,
			toEvmAddress(referrerRes.body.wallets['eip155']),
			entryBalance,
		)

		await setNativeBalance(ctx.publicClient, playerAddress, entryBalance)

		const buyEntriesBody = (entryCount: number) => ({
			presetId: PRESET_ID,
			entryCount,
			paymentCurrencyChainAddress: NATIVE_CURRENCY_CHAIN_ADDRESS,
		})

		await userRequest(ctx.app.getHttpServer())
			.post('/rips/entries/purchase')
			.set('x-telegram-id', TELEGRAM_ID_REFERRER)
			.send(buyEntriesBody(ENTRIES_PER_USER))
			.expect(200)

		await userRequest(ctx.app.getHttpServer())
			.post('/rips/entries/purchase')
			.set('x-telegram-id', TELEGRAM_ID_PLAYER)
			.send(buyEntriesBody(ENTRIES_PER_USER))
			.expect(200)

		await ensureIndexerSync(ctx.indexer, ctx.anvil)

		await clearCache(ctx)
		await ctx.app.get(KeeperUseCase).execute()

		const rawLogs = await getRipsLogs(ctx)

		const vrfRequestId = parseRandomnessRequested(rawLogs)

		const receipt = await fulfillRandomWords(
			ctx,
			KEEPER_PRIVATE_KEY,
			vrfRequestId,
		)
		parseRandomnessFulfilled(receipt.logs)

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
	}

	it('keeper claims payouts and accrued reward on-chain matches endpoint result', async () => {
		await runGameCycle()

		await clearCache(ctx)
		await ctx.app.get(KeeperUseCase).execute()

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
		await clearCache(ctx)

		await ctx.app.get(SyncSettlingRipsUseCase).execute()

		const rawLogs = await getRipsLogs(ctx)

		const referralFeeAccrued = parseEventLogs({
			abi: ripsAbi,
			eventName: 'ReferralFeeAccrued',
			logs: rawLogs,
		}).find(
			(log) =>
				log.args.referrer?.toLowerCase() ===
				referrerAddress.toLowerCase(),
		)

		const res = await userRequest(ctx.app.getHttpServer())
			.get('/referral-system/referrers')
			.set('x-telegram-id', TELEGRAM_ID_REFERRER)
			.expect(200)

		availableReward = BigInt(res.body.states[0].rewards.available)

		expect(availableReward).toBe(referralFeeAccrued?.args.amount)
	})

	it('referrer withdraws reward, balance increases by reward minus tx cost, and available resets to zero', async () => {
		const [balanceBefore] = await getBalances(
			[referrerAddress],
			ctx.publicClient,
		)

		const withdrawRes = await userRequest(ctx.app.getHttpServer())
			.post('/referral-system/rewards')
			.set('x-telegram-id', TELEGRAM_ID_REFERRER)
			.send({ currencyAddress: NATIVE_ADDRESS })
			.expect(200)

		const txCost = BigInt(
			withdrawRes.body.withdrawal.transaction.cost.amount,
		)

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
		await clearCache(ctx)

		const [balanceAfter] = await getBalances(
			[referrerAddress],
			ctx.publicClient,
		)

		expect(balanceAfter - balanceBefore).toBe(availableReward - txCost)

		const referrerRes = await userRequest(ctx.app.getHttpServer())
			.get('/referral-system/referrers')
			.set('x-telegram-id', TELEGRAM_ID_REFERRER)
			.expect(200)

		const state = referrerRes.body.states[0]

		expect(BigInt(state.rewards.available)).toBe(0n)
		expect(BigInt(state.rewards.withdrawn)).toBe(availableReward)
	})
})
