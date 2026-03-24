import { RoundRepository } from 'src/application/interfaces/repositories/round.repository'
import { StakeRepository } from 'src/application/interfaces/repositories/stake.repository'
import { KeeperUseCase } from 'src/application/use-cases/keeper/keeper.use-case'
import { Round, RoundStatus } from 'src/domain/entities/round'
import { Stake } from 'src/domain/entities/stake'
import request from 'supertest'
import {
	createWalletClient,
	getAddress,
	http,
	parseEther,
	type Address,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { setNativeBalance } from '../utils/anvil'
import deployments from '../utils/deployments.json'
import { useRipsApp } from '../utils/rips-app'
import { vrfCoordinatorAbi } from '../utils/vrf-coordinator-abi'

const STAKE_ID = 1
const TICKET_COST = parseEther('0.005')
const TICKETS_PER_USER = 4
const TICKET_CAP = 8

const KEEPER_PRIVATE_KEY =
	'0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const TELEGRAM_ID_USER_1 = '111222333'
const TELEGRAM_ID_USER_2 = '444555666'

const STAKE: Stake = {
	id: STAKE_ID,
	ticketCup: TICKET_CAP,
	ticketPrice: {
		currency: {} as never,
		amount: TICKET_COST,
	},
	durationSeconds: 86400,
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
			minPrize: parseEther('0.02'),
			maxPrize: parseEther('0.02'),
		},
	],
}

const mockStakeRepository: StakeRepository = {
	getStakes: async () => Promise.resolve([STAKE]),
}

describe('Reveal prizes flow E2E', () => {
	let roundId: number
	let user1Address: Address
	let user2Address: Address
	let user2BalanceBeforeClaim: bigint
	let user2OnChainPrize: bigint

	const roundRepository = new (class extends RoundRepository {
		private rounds: Round[] = []

		setRounds(rounds: Round[]) {
			this.rounds = rounds
		}

		async getRounds() {
			return Promise.resolve(this.rounds)
		}
	})()

	const ctx = useRipsApp((builder) =>
		builder
			.overrideProvider(StakeRepository)
			.useValue(mockStakeRepository)
			.overrideProvider(RoundRepository)
			.useValue(roundRepository),
	)

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

	async function fulfillRandomWords(vrfRequestId: bigint): Promise<void> {
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
	}

	it('creates two users and buys 4 tickets each to fill the round', async () => {
		user1Address = await createUserAndFund(TELEGRAM_ID_USER_1)
		user2Address = await createUserAndFund(TELEGRAM_ID_USER_2)

		const res1 = await request(ctx.app.getHttpServer())
			.post(`/rips/users/${TELEGRAM_ID_USER_1}/buy-tickets`)
			.send({ stakeId: STAKE_ID, amount: TICKETS_PER_USER })
			.expect(201)

		roundId = res1.body.roundId

		expect(res1.body.ticketAmount).toBe(TICKETS_PER_USER)

		const res2 = await request(ctx.app.getHttpServer())
			.post(`/rips/users/${TELEGRAM_ID_USER_2}/buy-tickets`)
			.send({ stakeId: STAKE_ID, amount: TICKETS_PER_USER })
			.expect(201)

		expect(res2.body.roundId).toBe(roundId)
		expect(res2.body.ticketAmount).toBe(TICKETS_PER_USER)
	})

	it('keeper requests VRF on the sealed round', async () => {
		roundRepository.setRounds([
			{
				id: roundId,
				stake: STAKE,
				status: RoundStatus.SEALED,
				startTime: new Date(),
				actions: { purchases: [], claims: [], refunds: [] },
			},
		])

		const keeperUseCase = ctx.app.get(KeeperUseCase)

		await keeperUseCase.execute()

		roundRepository.setRounds([])

		const randomnessRequestedLogs = await ctx.publicClient.getLogs({
			address: deployments.rips as Address,
			event: {
				type: 'event',
				name: 'RandomnessRequested',
				inputs: [
					{ name: 'roundId', type: 'uint256', indexed: true },
					{ name: 'vrfRequestId', type: 'uint256', indexed: false },
				],
			},
			fromBlock: 0n,
		})

		const roundLog = randomnessRequestedLogs.find(
			(log) => log.args.roundId === BigInt(roundId),
		)

		expect(roundLog).toBeTruthy()
	})

	it('VRF coordinator fulfills randomness and round is finalized', async () => {
		const randomnessRequestedLogs = await ctx.publicClient.getLogs({
			address: deployments.rips as Address,
			event: {
				type: 'event',
				name: 'RandomnessRequested',
				inputs: [
					{ name: 'roundId', type: 'uint256', indexed: true },
					{ name: 'vrfRequestId', type: 'uint256', indexed: false },
				],
			},
			fromBlock: 0n,
		})

		const roundLog = randomnessRequestedLogs.find(
			(log) => log.args.roundId === BigInt(roundId),
		)

		const vrfRequestId = roundLog?.args.vrfRequestId

		expect(vrfRequestId).toBeDefined()

		await fulfillRandomWords(vrfRequestId!)

		const roundFinalizedLogs = await ctx.publicClient.getLogs({
			address: deployments.rips as Address,
			event: {
				type: 'event',
				name: 'RoundFinalized',
				inputs: [
					{ name: 'roundId', type: 'uint256', indexed: true },
					{ name: 'randomA', type: 'uint256', indexed: false },
					{ name: 'randomB', type: 'uint256', indexed: false },
				],
			},
			fromBlock: 0n,
		})

		const finalizedLog = roundFinalizedLogs.find(
			(log) => log.args.roundId === BigInt(roundId),
		)

		expect(finalizedLog).toBeTruthy()
	})

	it('keeper claims prizes and records them in the database', async () => {
		const roundFinalizedLogs = await ctx.publicClient.getLogs({
			address: deployments.rips as Address,
			event: {
				type: 'event',
				name: 'RoundFinalized',
				inputs: [
					{ name: 'roundId', type: 'uint256', indexed: true },
					{ name: 'randomA', type: 'uint256', indexed: false },
					{ name: 'randomB', type: 'uint256', indexed: false },
				],
			},
			fromBlock: 0n,
		})

		const finalizedLog = roundFinalizedLogs.find(
			(log) => log.args.roundId === BigInt(roundId),
		)

		const { randomA, randomB } = finalizedLog?.args ?? {}

		expect(randomA).toBeDefined()
		expect(randomB).toBeDefined()

		roundRepository.setRounds([
			{
				id: roundId,
				stake: STAKE,
				status: RoundStatus.CLAIMING,
				startTime: new Date(),
				actions: {
					purchases: [
						{
							userAddress: user1Address,
							ticketAmount: BigInt(TICKETS_PER_USER),
							startTicketIndex: 0n,
						},
						{
							userAddress: user2Address,
							ticketAmount: BigInt(TICKETS_PER_USER),
							startTicketIndex: BigInt(TICKETS_PER_USER),
						},
					],
					claims: [],
					refunds: [],
				},
				randoms: { a: randomA!, b: randomB! },
			},
		])

		user2BalanceBeforeClaim = await ctx.publicClient.getBalance({
			address: user2Address,
		})

		const keeperUseCase = ctx.app.get(KeeperUseCase)

		await keeperUseCase.execute()

		roundRepository.setRounds([])

		const prizesClaimed = await ctx.publicClient.getLogs({
			address: deployments.rips as Address,
			event: {
				type: 'event',
				name: 'PrizesClaimed',
				inputs: [
					{ name: 'roundId', type: 'uint256', indexed: true },
					{ name: 'claimer', type: 'address', indexed: true },
					{ name: 'amount', type: 'uint256', indexed: false },
				],
			},
			fromBlock: 0n,
		})

		const user2ClaimLog = prizesClaimed.find(
			(log) =>
				log.args.claimer?.toLowerCase() ===
					user2Address.toLowerCase() &&
				log.args.roundId === BigInt(roundId),
		)

		expect(user2ClaimLog).toBeTruthy()

		user2OnChainPrize = user2ClaimLog?.args.amount ?? 0n
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

	it('sum of user 2 DB prize amounts matches on-chain claimed amount and balance change', async () => {
		const user2BalanceAfterClaim = await ctx.publicClient.getBalance({
			address: user2Address,
		})

		expect(user2BalanceAfterClaim - user2BalanceBeforeClaim).toBe(
			user2OnChainPrize,
		)
	})
})
