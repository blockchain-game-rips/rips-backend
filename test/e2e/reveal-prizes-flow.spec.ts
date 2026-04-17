import { Test } from '@nestjs/testing'
import request from 'supertest'
import {
	createWalletClient,
	getAddress,
	http,
	parseEther,
	parseEventLogs,
	type Address,
	type TransactionReceipt,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { RoundRepository } from '../../src/application/interfaces/repositories/round.repository'
import { StakeRepository } from '../../src/application/interfaces/repositories/stake.repository'
import { GetAvailableStakesUseCase } from '../../src/application/use-cases/get-available-stakes/get-available-stakes.use-case'
import { KeeperUseCase } from '../../src/application/use-cases/keeper/keeper.use-case'
import { SyncClaimEventsUseCase } from '../../src/application/use-cases/sync-claim-events/sync-claim-events.use-case'
import { EIP155 } from '../../src/constants'
import { Config } from '../../src/domain/entities/config'
import { Currency } from '../../src/domain/entities/currency'
import {
	CompletedRound,
	OngoingRound,
	RoundStatus,
} from '../../src/domain/entities/round'
import { Stake } from '../../src/domain/entities/stake'
import { composeChainId } from '../../src/domain/services/chain-id-utils'
import { composeCurrencyId } from '../../src/domain/services/currency-id-utils'
import { IndexerModule } from '../../src/infrastructure/indexer/indexer.module'
import { ripsAbi } from '../../src/infrastructure/rips/rips-abi'
import { SeedCardDefinitionsService } from '../../src/infrastructure/seed/seed-card-definitions.service'
import { SeedModule } from '../../src/infrastructure/seed/seed.module'
import { getBalances, setNativeBalance } from '../utils/anvil'
import {
	MockIndexerModule,
	MockRoundRepository,
} from '../utils/mock-indexer.module'
import { useRipsApp } from '../utils/rips-app'
import deployments from '../utils/state/deployments.json'
import { vrfCoordinatorAbi } from '../utils/vrf-coordinator-abi'
import cardsConfig from './cards.json'

const STAKE_ID = 1
const TICKET_COST = parseEther('0.005')
const TICKETS_PER_USER = 4
const TICKET_CAP = 8

const KEEPER_PRIVATE_KEY =
	'0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const TELEGRAM_ID_USER_1 = '111222333'
const TELEGRAM_ID_USER_2 = '444555666'

describe('Reveal prizes flow E2E', () => {
	let roundId: number
	let user1Address: Address
	let user2Address: Address
	let vrfRequestId: bigint
	let randomA: bigint
	let randomB: bigint

	const roundRepository = new MockRoundRepository()

	const stakeRepository = new (class extends StakeRepository {
		private stakesWithRounds: {
			stake: Stake
			ongoingRounds: OngoingRound[]
		}[] = []

		setOngoingRounds(rounds: OngoingRound[]) {
			this.stakesWithRounds = [{ stake: STAKE, ongoingRounds: rounds }]
		}

		setRoundSealed(roundId: number) {
			this.setOngoingRounds([
				{
					id: roundId,
					stake: STAKE,
					config: STAKE_CONFIG,
					currency: nativeCurrency,
					status: RoundStatus.SEALED,
					startTime: new Date(),
					actions: { purchases: [], claims: [], refunds: [] },
				},
			])
		}

		setRoundClaiming(
			roundId: number,
			purchases: OngoingRound['actions']['purchases'],
			randoms: NonNullable<OngoingRound['randoms']>,
		) {
			this.setOngoingRounds([
				{
					id: roundId,
					stake: STAKE,
					config: STAKE_CONFIG,
					currency: nativeCurrency,
					status: RoundStatus.CLAIMING,
					startTime: new Date(),
					actions: { purchases, claims: [], refunds: [] },
					randoms,
				},
			])
		}

		async getStakesWithOngoingRounds() {
			return Promise.resolve(this.stakesWithRounds)
		}
	})()

	const mockGetAvailableStakesUseCase: Pick<
		GetAvailableStakesUseCase,
		'execute'
	> = {
		execute: async () =>
			Promise.resolve([
				{
					stake: STAKE,
					fillingRound: {
						id: 1,
						stake: STAKE,
						config: STAKE_CONFIG,
						currency: nativeCurrency,
						actions: { purchases: [], claims: [], refunds: [] },
						status: RoundStatus.FILLING,
						startTime: new Date(),
					},
				},
				{
					stake: { ...STAKE_2, currentConfig: STAKE_2_CONFIG },
					fillingRound: null,
				},
			]),
	}

	const ctx = useRipsApp((builder) =>
		builder
			.overrideProvider(GetAvailableStakesUseCase)
			.useValue(mockGetAvailableStakesUseCase)
			.overrideProvider(StakeRepository)
			.useValue(stakeRepository)
			.overrideProvider(RoundRepository)
			.useValue(roundRepository),
	)

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [SeedModule],
		})
			.overrideModule(IndexerModule)
			.useModule(MockIndexerModule)
			.overrideProvider(GetAvailableStakesUseCase)
			.useValue(mockGetAvailableStakesUseCase)
			.compile()

		const seedApp = moduleRef.createNestApplication()
		await seedApp.init()

		const seedService = seedApp.get(SeedCardDefinitionsService)
		await seedService.seed(seedService.parseConfig(cardsConfig))

		await seedApp.close()
	})

	async function createUserAndFund(telegramId: string): Promise<Address> {
		await request(ctx.app.getHttpServer())
			.post('/users')
			.send({ telegramId })
			.expect(201)

		const userRes = await request(ctx.app.getHttpServer())
			.get(`/users/${telegramId}`)
			.expect(200)

		const address: Address = getAddress(userRes.body.wallets['eip155'])

		await setNativeBalance(
			ctx.publicClient,
			address,
			TICKET_COST * BigInt(TICKETS_PER_USER) * 2n,
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

	async function getPrizeClaimedByUser(
		userAddress: Address,
	): Promise<bigint | undefined> {
		const rawLogs = await ctx.publicClient.getLogs({
			address: deployments.rips as Address,
			fromBlock: 0n,
		})

		const prizesClaimed = parseEventLogs({
			abi: ripsAbi,
			eventName: 'PrizesClaimed',
			logs: rawLogs,
		})

		return prizesClaimed.find(
			(log) => log.args.user?.toLowerCase() === userAddress.toLowerCase(),
		)?.args.prizeAmount
	}

	it('creates two users and buys 4 tickets each to fill the round', async () => {
		user1Address = await createUserAndFund(TELEGRAM_ID_USER_1)
		user2Address = await createUserAndFund(TELEGRAM_ID_USER_2)

		const buyTicketsBody = (ticketCount: number) => ({
			stakeId: STAKE_ID,
			ticketCount,
			paymentCurrencyChainAddress: {
				address: '0x0000000000000000000000000000000000000000',
				chain: { namespace: 'eip155', reference: '31337' },
			},
		})

		const res1 = await request(ctx.app.getHttpServer())
			.post(`/rips/users/${TELEGRAM_ID_USER_1}/buy-tickets`)
			.send(buyTicketsBody(TICKETS_PER_USER))
			.expect(201)

		roundId = res1.body.roundId

		expect(res1.body.ticketCount).toBe(TICKETS_PER_USER)

		const res2 = await request(ctx.app.getHttpServer())
			.post(`/rips/users/${TELEGRAM_ID_USER_2}/buy-tickets`)
			.send(buyTicketsBody(TICKETS_PER_USER))
			.expect(201)

		expect(res2.body.roundId).toBe(roundId)
		expect(res2.body.ticketCount).toBe(TICKETS_PER_USER)
	})

	it('keeper requests VRF on the sealed round', async () => {
		stakeRepository.setRoundSealed(roundId)

		await ctx.app.get(KeeperUseCase).execute()

		stakeRepository.setOngoingRounds([])

		const rawLogs = await ctx.publicClient.getLogs({
			address: deployments.rips as Address,
			fromBlock: 0n,
		})

		vrfRequestId = parseRandomnessRequested(rawLogs)

		expect(vrfRequestId).toBeDefined()
	})

	it('VRF coordinator fulfills randomness and round is finalized', async () => {
		const fulfillReceipt = await fulfillRandomWords(vrfRequestId)

		const randoms = parseRandomnessFulfilled(fulfillReceipt.logs)

		expect(randoms).toBeDefined()

		randomA = randoms.randomA
		randomB = randoms.randomB
	})

	it('keeper claims prizes and records them in the database', async () => {
		const purchases: OngoingRound['actions']['purchases'] = [
			{
				userAddress: user1Address,
				ticketCount: BigInt(TICKETS_PER_USER),
				startTicketIndex: 0n,
			},
			{
				userAddress: user2Address,
				ticketCount: BigInt(TICKETS_PER_USER),
				startTicketIndex: BigInt(TICKETS_PER_USER),
			},
		]

		const randoms = { a: randomA, b: randomB }

		stakeRepository.setRoundClaiming(roundId, purchases, randoms)

		const claimedRound: CompletedRound = {
			id: roundId,
			stake: STAKE,
			config: STAKE_CONFIG,
			currency: nativeCurrency,
			status: RoundStatus.CLAIMED,
			startTime: new Date(),
			actions: { purchases, claims: [], refunds: [] },
			randoms,
		}

		const [user1BalanceBeforeClaim, user2BalanceBeforeClaim] =
			await getBalances([user1Address, user2Address], ctx.publicClient)

		await ctx.app.get(KeeperUseCase).execute()

		stakeRepository.setOngoingRounds([])

		roundRepository.setNextClaimedRound(claimedRound)
		await ctx.app.get(SyncClaimEventsUseCase).execute()
		roundRepository.setNextClaimedRound(null)

		const user1OnChainPrize = await getPrizeClaimedByUser(user1Address)
		const user2OnChainPrize = await getPrizeClaimedByUser(user2Address)

		expect(user1OnChainPrize).toBeDefined()
		expect(user2OnChainPrize).toBeDefined()

		const [user1BalanceAfterClaim, user2BalanceAfterClaim] =
			await getBalances([user1Address, user2Address], ctx.publicClient)

		expect(user1BalanceAfterClaim - user1BalanceBeforeClaim).toBe(
			user1OnChainPrize ?? 0n,
		)
		expect(user2BalanceAfterClaim - user2BalanceBeforeClaim).toBe(
			user2OnChainPrize ?? 0n,
		)
	})

	it('get-unrevealed-prizes returns 4 tickets for each user', async () => {
		const res1 = await request(ctx.app.getHttpServer())
			.get(`/users/${TELEGRAM_ID_USER_1}/unrevealed-prizes`)
			.expect(200)

		const res2 = await request(ctx.app.getHttpServer())
			.get(`/users/${TELEGRAM_ID_USER_2}/unrevealed-prizes`)
			.expect(200)

		expect(res1.body).toHaveLength(TICKETS_PER_USER)
		expect(res2.body).toHaveLength(TICKETS_PER_USER)
	})

	it('user 1 reveals 1 ticket, user 2 reveals all 4 tickets', async () => {
		const revealOneRes = await request(ctx.app.getHttpServer())
			.post(`/users/${TELEGRAM_ID_USER_1}/reveal`)
			.send({ revealAll: false })
			.expect(201)

		expect(revealOneRes.body).toHaveLength(1)

		const revealAllRes = await request(ctx.app.getHttpServer())
			.post(`/users/${TELEGRAM_ID_USER_2}/reveal`)
			.send({ revealAll: true })
			.expect(201)

		expect(revealAllRes.body).toHaveLength(TICKETS_PER_USER)
	})

	it('user 1 has 3 unrevealed tickets remaining, user 2 has 0', async () => {
		const res1 = await request(ctx.app.getHttpServer())
			.get(`/users/${TELEGRAM_ID_USER_1}/unrevealed-prizes`)
			.expect(200)

		const res2 = await request(ctx.app.getHttpServer())
			.get(`/users/${TELEGRAM_ID_USER_2}/unrevealed-prizes`)
			.expect(200)

		expect(res1.body).toHaveLength(TICKETS_PER_USER - 1)
		expect(res2.body).toHaveLength(0)
	})
})

const ANVIL_CHAIN_ID = 31337
const NATIVE_ADDRESS = getAddress('0x0000000000000000000000000000000000000000')

const nativeCurrency: Currency = {
	id: composeCurrencyId(
		composeChainId(EIP155, ANVIL_CHAIN_ID.toString()),
		NATIVE_ADDRESS,
	),
	chainAddress: {
		chain: { namespace: EIP155, reference: ANVIL_CHAIN_ID.toString() },
		address: NATIVE_ADDRESS,
	},
	symbol: 'ETH',
	name: 'ETH',
	decimals: 18,
}

const STAKE_CONFIG: Config = {
	id: 1,
	ticketCup: TICKET_CAP,
	feePercent: 0,
	ticketPrice: {
		currency: nativeCurrency,
		amount: TICKET_COST,
	},
	durationSeconds: 300,
	prizeDistribution: [
		{
			prizeCount: 5n,
			minPrize: parseEther('0.0008'),
			maxPrize: parseEther('0.0012'),
		},
		{
			prizeCount: 2n,
			minPrize: parseEther('0.007'),
			maxPrize: parseEther('0.008'),
		},
		{
			prizeCount: 1n,
			minPrize: parseEther('0.018'),
			maxPrize: parseEther('0.018'),
		},
	],
}

const STAKE_2_CONFIG: Config = {
	id: 2,
	ticketCup: TICKET_CAP,
	feePercent: 0,
	ticketPrice: {
		currency: nativeCurrency,
		amount: parseEther('0.01'),
	},
	durationSeconds: 300,
	prizeDistribution: [
		{
			prizeCount: 5n,
			minPrize: parseEther('0.0016'),
			maxPrize: parseEther('0.0024'),
		},
		{
			prizeCount: 2n,
			minPrize: parseEther('0.014'),
			maxPrize: parseEther('0.016'),
		},
		{
			prizeCount: 1n,
			minPrize: parseEther('0.036'),
			maxPrize: parseEther('0.036'),
		},
	],
}

const STAKE: Stake = {
	id: STAKE_ID,
	currentConfig: STAKE_CONFIG,
}

const STAKE_2: Stake = {
	id: 2,
	currentConfig: STAKE_2_CONFIG,
}

function parseRandomnessRequested(logs: TransactionReceipt['logs']): bigint {
	const [log] = parseEventLogs({
		abi: ripsAbi,
		eventName: 'RandomnessRequested',
		logs,
	})
	return log.args.vrfRequestId
}

function parseRandomnessFulfilled(logs: TransactionReceipt['logs']): {
	randomA: bigint
	randomB: bigint
} {
	const [log] = parseEventLogs({
		abi: ripsAbi,
		eventName: 'RandomnessFulfilled',
		logs,
	})
	return { randomA: log.args.randomA, randomB: log.args.randomB }
}
