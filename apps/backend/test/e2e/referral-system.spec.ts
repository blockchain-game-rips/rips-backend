import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import {
	ANVIL_ACCOUNT_0_PRIVATE_KEY,
	deployments,
	ensureIndexerSync,
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
import { KeeperUseCase } from '../../src/application/use-cases/keeper/keeper.use-case'
import { SyncCompletedRipsUseCase } from '../../src/application/use-cases/sync-completed-rips/sync-completed-rips.use-case'
import {
	EvmAddress,
	toEvmAddress,
} from '../../src/domain/value-objects/evm-address'
import { ripsAbi } from '../../src/infrastructure/rips/rips-abi'
import { SeedCardDefinitionsService } from '../../src/infrastructure/seed/seed-card-definitions.service'
import cardsConfig from '../fixtures/cards.json'
import {
	NATIVE_ADDRESS,
	NATIVE_CURRENCY_CHAIN_ADDRESS,
} from '../fixtures/entities'
import { vrfCoordinatorAbi } from '../fixtures/vrf-coordinator-abi'
import { useRipsApp } from '../utils/rips-app'
import { parseRandomnessFulfilled } from '../utils/rips-events'

const PRESET_ID = 1
const ENTRY_COST = parseEther('0.005')
const ENTRIES_PER_USER = 4

const KEEPER_PRIVATE_KEY = ANVIL_ACCOUNT_0_PRIVATE_KEY

const TELEGRAM_ID_REFERRER = '100200300'
const TELEGRAM_ID_PLAYER = '400500600'

describe('Referral system E2E', () => {
	let referrerAddress: EvmAddress
	let playerAddress: EvmAddress
	let availableReward: bigint

	const ctx = useRipsApp()

	beforeAll(async () => {
		await clearCache()

		const seedService = ctx.app.get(SeedCardDefinitionsService)
		await seedService.seed(seedService.parseConfig(cardsConfig))
	})

	async function clearCache(): Promise<void> {
		const cache = ctx.app.get<Cache>(CACHE_MANAGER)
		await cache.clear()
	}

	async function fulfillRandomWords(
		requestId: bigint,
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
			args: [requestId, deployments.rips as Address],
		})

		const receipt = await ctx.publicClient.waitForTransactionReceipt({
			hash,
		})

		expect(receipt.status).toBe('success')

		return receipt
	}

	it('creates referrer user', async () => {
		const res = await request(ctx.app.getHttpServer())
			.post('/users')
			.send({ telegramId: TELEGRAM_ID_REFERRER })
			.expect(201)

		referrerAddress = toEvmAddress(res.body.wallets['eip155'])

		expect(referrerAddress).toMatch(/^0x[0-9a-fA-F]{40}$/)
	})

	it('creates player user linked to referrer', async () => {
		const res = await request(ctx.app.getHttpServer())
			.post('/users')
			.send({ telegramId: TELEGRAM_ID_PLAYER, referrerAddress })
			.expect(201)

		expect(res.body.referrerAddress).toBe(referrerAddress)
	})

	async function runGameCycle(): Promise<void> {
		const referrerRes = await request(ctx.app.getHttpServer())
			.get(`/users/${TELEGRAM_ID_REFERRER}`)
			.expect(200)

		const playerRes = await request(ctx.app.getHttpServer())
			.get(`/users/${TELEGRAM_ID_PLAYER}`)
			.expect(200)

		playerAddress = toEvmAddress(playerRes.body.wallets['eip155'])

		const entryBalance = ENTRY_COST * BigInt(ENTRIES_PER_USER) * 2n

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

		await request(ctx.app.getHttpServer())
			.post('/rips/entries/purchase')
			.set('x-telegram-id', TELEGRAM_ID_REFERRER)
			.send(buyEntriesBody(ENTRIES_PER_USER))
			.expect(201)

		await request(ctx.app.getHttpServer())
			.post('/rips/entries/purchase')
			.set('x-telegram-id', TELEGRAM_ID_PLAYER)
			.send(buyEntriesBody(ENTRIES_PER_USER))
			.expect(201)

		await ensureIndexerSync(ctx.indexer, ctx.anvil)

		await clearCache()
		await ctx.app.get(KeeperUseCase).execute()

		const rawLogs = await ctx.publicClient.getLogs({
			address: deployments.rips as Address,
			fromBlock: 0n,
		})

		const vrfRequestId = parseRandomnessRequested(rawLogs)

		const receipt = await fulfillRandomWords(vrfRequestId)
		parseRandomnessFulfilled(receipt.logs)

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
	}

	it('keeper claims payouts and accrued reward on-chain matches endpoint result', async () => {
		await runGameCycle()

		await clearCache()
		await ctx.app.get(KeeperUseCase).execute()

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
		await clearCache()

		await ctx.app.get(SyncCompletedRipsUseCase).execute()

		const rawLogs = await ctx.publicClient.getLogs({
			address: deployments.rips as Address,
			fromBlock: 0n,
		})

		const referralFeeAccrued = parseEventLogs({
			abi: ripsAbi,
			eventName: 'ReferralFeeAccrued',
			logs: rawLogs,
		}).find(
			(log) =>
				log.args.referrer?.toLowerCase() ===
				referrerAddress.toLowerCase(),
		)

		const res = await request(ctx.app.getHttpServer())
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

		const withdrawRes = await request(ctx.app.getHttpServer())
			.post('/referral-system/rewards')
			.set('x-telegram-id', TELEGRAM_ID_REFERRER)
			.send({ currencyAddress: NATIVE_ADDRESS })
			.expect(201)

		const txCost = BigInt(withdrawRes.body.transaction.cost.amount)

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
		await clearCache()

		const [balanceAfter] = await getBalances(
			[referrerAddress],
			ctx.publicClient,
		)

		expect(balanceAfter - balanceBefore).toBe(availableReward - txCost)

		const referrerRes = await request(ctx.app.getHttpServer())
			.get('/referral-system/referrers')
			.set('x-telegram-id', TELEGRAM_ID_REFERRER)
			.expect(200)

		const state = referrerRes.body.states[0]

		expect(BigInt(state.rewards.available)).toBe(0n)
		expect(BigInt(state.rewards.withdrawn)).toBe(availableReward)
	})
})

function parseRandomnessRequested(logs: TransactionReceipt['logs']): bigint {
	const [log] = parseEventLogs({
		abi: ripsAbi,
		eventName: 'RandomnessRequested',
		logs,
	})
	return log.args.vrfRequestId
}
