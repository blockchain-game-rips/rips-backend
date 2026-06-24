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
import { vrfCoordinatorAbi } from '../fixtures/vrf-coordinator-abi'
import { useRipsApp } from '../utils/rips-app'
import { parseRandomnessFulfilled } from '../utils/rips-events'

const PRESET_ID = 1
const ENTRY_COST = parseEther('0.005')
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

	beforeAll(async () => {
		await clearCache()

		const seedService = ctx.app.get(SeedCardDefinitionsService)
		await seedService.seed(seedService.parseConfig(cardsConfig))
	})

	async function clearCache(): Promise<void> {
		const cache = ctx.app.get<Cache>(CACHE_MANAGER)
		await cache.clear()
	}

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
				chain: { namespace: 'eip155', reference: '8453' },
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

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
	})

	it('keeper requests VRF on the sealed rip', async () => {
		await clearCache()
		await ctx.app.get(KeeperUseCase).execute()

		const rawLogs = await ctx.publicClient.getLogs({
			address: deployments.rips as Address,
			fromBlock: 0n,
		})

		vrfRequestId = parseRandomnessRequested(rawLogs)

		expect(vrfRequestId).toBeDefined()

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
	})

	it('VRF coordinator fulfills randomness and rip is finalized', async () => {
		const fulfillReceipt = await fulfillRandomWords(vrfRequestId)

		const randoms = parseRandomnessFulfilled(fulfillReceipt.logs)

		expect(randoms).toBeDefined()

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
	})

	it('keeper claims payouts and records them in the database', async () => {
		await clearCache()

		const [user1BalanceBeforeClaim, user2BalanceBeforeClaim] =
			await getBalances([user1Address, user2Address], ctx.publicClient)

		await ctx.app.get(KeeperUseCase).execute()

		await ensureIndexerSync(ctx.indexer, ctx.anvil)
		await clearCache()

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

function parseRandomnessRequested(logs: TransactionReceipt['logs']): bigint {
	const [log] = parseEventLogs({
		abi: ripsAbi,
		eventName: 'RandomnessRequested',
		logs,
	})
	return log.args.vrfRequestId
}
