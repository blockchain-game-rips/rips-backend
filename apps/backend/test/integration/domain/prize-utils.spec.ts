import {
	ANVIL_ACCOUNT_0_PRIVATE_KEY,
	ANVIL_ACCOUNT_1_PRIVATE_KEY,
	ANVIL_ACCOUNT_2_PRIVATE_KEY,
	ANVIL_STATE_PATH,
	deployments,
	getBalances,
	useAnvil,
	waitForReceipt,
} from '@rips/test-harness'
import {
	Chain,
	createPublicClient,
	createWalletClient,
	defineChain,
	http,
	HttpTransport,
	parseEther,
	parseEventLogs,
	WalletClient,
	zeroAddress,
	type Address,
	type PublicClient,
} from 'viem'
import { Account, privateKeyToAccount } from 'viem/accounts'
import {
	resolveOnchainPrize,
	resolvePrize,
} from '../../../src/domain/services/prize-utils'
import { CardCollection } from '../../../src/domain/value-objects/card-collection'
import { ripsAbi } from '../../../src/infrastructure/rips/rips-abi'
import { vrfCoordinatorAbi } from '../../fixtures/vrf-coordinator-abi'
import { parseRandomnessFulfilled } from '../../utils/rips-events'

const CHAIN_ID = 8453
const CHAIN = defineChain({
	id: CHAIN_ID,
	name: 'Base',
	nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
	rpcUrls: { default: { http: [] } },
})

const RIPS_ADDRESS = deployments.rips as Address
const VRF_COORDINATOR_ADDRESS = deployments.vrfCoordinator as Address
const STAKE_ID = 1n
const TICKET_COST = parseEther('0.005')
const USER_1_TICKET_COUNT = 6n
const USER_2_TICKET_COUNT = 2n

const KEEPER_PRIVATE_KEY = ANVIL_ACCOUNT_0_PRIVATE_KEY
const USER_1_PRIVATE_KEY = ANVIL_ACCOUNT_1_PRIVATE_KEY
const USER_2_PRIVATE_KEY = ANVIL_ACCOUNT_2_PRIVATE_KEY

const PRIZE_DISTRIBUTION = [
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
]

const STUB_CARD: CardCollection = [
	{ card: { id: 1, name: 'Stub', tier: 1, imageUrl: '' }, count: 1 },
]
const STUB_COLLECTIONS: CardCollection[] = [STUB_CARD, STUB_CARD, STUB_CARD]

describe('prize-utils: resolvePrize matches on-chain balance diff', () => {
	const { anvils } = useAnvil({
		chainId: CHAIN_ID,
		pathToState: ANVIL_STATE_PATH,
	})

	let publicClient: PublicClient<HttpTransport, Chain>
	let user1Address: Address
	let user2Address: Address
	let randomA: bigint
	let randomB: bigint
	let user1BalanceBefore: bigint
	let user2BalanceBefore: bigint

	beforeAll(() => {
		const rpcUrl = `http://127.0.0.1:${anvils[0].port}`
		publicClient = createPublicClient({ transport: http(rpcUrl) })
	})

	function makeWallet(
		privateKey: `0x${string}`,
	): WalletClient<HttpTransport, Chain, Account> {
		const rpcUrl = `http://127.0.0.1:${anvils[0].port}`
		return createWalletClient({
			account: privateKeyToAccount(privateKey),
			chain: CHAIN,
			transport: http(rpcUrl),
		})
	}

	describe('given users bought tickets, VRF fulfilled, and prizes claimed', () => {
		beforeAll(async () => {
			const user1Wallet = makeWallet(USER_1_PRIVATE_KEY)
			const user2Wallet = makeWallet(USER_2_PRIVATE_KEY)
			const keeperWallet = makeWallet(KEEPER_PRIVATE_KEY)

			const roundId = 1n

			user1Address = user1Wallet.account.address
			user2Address = user2Wallet.account.address

			await buyTickets(
				user1Wallet,
				user1Address,
				USER_1_TICKET_COUNT,
				publicClient,
			)
			await buyTickets(
				user2Wallet,
				user2Address,
				USER_2_TICKET_COUNT,
				publicClient,
			)

			const vrfReceipt = await waitForReceipt(
				keeperWallet.writeContract({
					address: RIPS_ADDRESS,
					abi: ripsAbi,
					functionName: 'requestRandomness',
					args: [roundId],
				}),
				publicClient,
			)

			const [randomnessLog] = parseEventLogs({
				abi: ripsAbi,
				eventName: 'RandomnessRequested',
				logs: vrfReceipt.logs,
			})

			const fulfillReceipt = await waitForReceipt(
				await keeperWallet.writeContract({
					address: VRF_COORDINATOR_ADDRESS,
					abi: vrfCoordinatorAbi,
					functionName: 'fulfillRandomWords',
					args: [randomnessLog.args.vrfRequestId, RIPS_ADDRESS],
				}),
				publicClient,
			)

			const randoms = parseRandomnessFulfilled(fulfillReceipt.logs)
			randomA = randoms.randomA
			randomB = randoms.randomB

			const balances = await getBalances(
				[user1Address, user2Address],
				publicClient,
			)
			user1BalanceBefore = balances[0]
			user2BalanceBefore = balances[1]

			await claimPrizes(keeperWallet, roundId, user1Address, publicClient)
			await claimPrizes(keeperWallet, roundId, user2Address, publicClient)
		})

		it('balance diff equals sum of resolvePrize for each user', async () => {
			const [user1BalanceAfter, user2BalanceAfter] = await getBalances(
				[user1Address, user2Address],
				publicClient,
			)

			const randoms = { a: randomA, b: randomB }

			const user1ExpectedPrize = sumPrizes(
				USER_1_TICKET_COUNT,
				0n,
				randoms,
			)
			const user2ExpectedPrize = sumPrizes(
				USER_2_TICKET_COUNT,
				USER_1_TICKET_COUNT,
				randoms,
			)

			expect(user1BalanceAfter - user1BalanceBefore).toBe(
				user1ExpectedPrize,
			)
			expect(user2BalanceAfter - user2BalanceBefore).toBe(
				user2ExpectedPrize,
			)
		})
	})

	describe('fuzz: resolvePrize matches on-chain calculateTicketPrize', () => {
		const FUZZ_N = 1024n
		const FUZZ_ITERATIONS = 100

		const FUZZ_PRIZE_DISTRIBUTION = [
			{
				prizeCount: 500n,
				minPrize: parseEther('0.0001'),
				maxPrize: parseEther('0.0005'),
			},
			{
				prizeCount: 250n,
				minPrize: parseEther('0.001'),
				maxPrize: parseEther('0.002'),
			},
			{
				prizeCount: 150n,
				minPrize: parseEther('0.005'),
				maxPrize: parseEther('0.008'),
			},
			{
				prizeCount: 75n,
				minPrize: parseEther('0.01'),
				maxPrize: parseEther('0.015'),
			},
			{
				prizeCount: 35n,
				minPrize: parseEther('0.03'),
				maxPrize: parseEther('0.05'),
			},
			{
				prizeCount: 10n,
				minPrize: parseEther('0.1'),
				maxPrize: parseEther('0.15'),
			},
			{
				prizeCount: 4n,
				minPrize: parseEther('0.5'),
				maxPrize: parseEther('1.0'),
			},
		]

		const FUZZ_TIER_BOUNDARIES: bigint[] = FUZZ_PRIZE_DISTRIBUTION.reduce<
			bigint[]
		>((acc, tier) => [...acc, (acc.at(-1) ?? 0n) + tier.prizeCount], [])

		const harnessAbi = [
			{
				type: 'function',
				name: 'exposed_calculateTicketPrize',
				inputs: [
					{
						name: 'ticketNumber',
						type: 'uint256',
						internalType: 'uint256',
					},
					{ name: 'a', type: 'uint64', internalType: 'uint64' },
					{ name: 'b', type: 'uint64', internalType: 'uint64' },
					{ name: 'n', type: 'uint64', internalType: 'uint64' },
					{
						name: 'tiers',
						type: 'tuple[]',
						internalType: 'struct IRips.PrizeTier[]',
						components: [
							{
								name: 'prizeCount',
								type: 'uint64',
								internalType: 'uint64',
							},
							{
								name: 'minPrize',
								type: 'uint128',
								internalType: 'uint128',
							},
							{
								name: 'maxPrize',
								type: 'uint128',
								internalType: 'uint128',
							},
						],
					},
					{
						name: 'tierBoundaries',
						type: 'uint64[]',
						internalType: 'uint64[]',
					},
				],
				outputs: [
					{ name: '', type: 'uint256', internalType: 'uint256' },
				],
				stateMutability: 'pure',
			},
		] as const

		it('prizeAmount matches on-chain for random inputs', async () => {
			for (let i = 0; i < FUZZ_ITERATIONS; i++) {
				const a = randomOddBigInt64()
				const b = randomBigInt64()
				const ticketNumber = randomBigIntInRange(1n, FUZZ_N)

				const prizeNumber = ((a * ticketNumber + b) % FUZZ_N) + 1n

				const { prizeAmount } = resolveOnchainPrize(
					prizeNumber,
					FUZZ_PRIZE_DISTRIBUTION,
				)

				const onChainPrize = await publicClient.readContract({
					address: RIPS_ADDRESS,
					abi: harnessAbi,
					functionName: 'exposed_calculateTicketPrize',
					args: [
						ticketNumber,
						a,
						b,
						FUZZ_N,
						FUZZ_PRIZE_DISTRIBUTION,
						FUZZ_TIER_BOUNDARIES,
					],
				})

				if (prizeAmount !== onChainPrize) {
					throw new Error(
						`a=${a} b=${b} ticketNumber=${ticketNumber}: ts=${prizeAmount} onChain=${onChainPrize}`,
					)
				}
			}
		})
	})
})

type Wallet = WalletClient<HttpTransport, Chain, Account>

async function buyTickets(
	wallet: Wallet,
	recipient: Address,
	ticketCount: bigint,
	publicClient: PublicClient<HttpTransport, Chain>,
): Promise<void> {
	await waitForReceipt(
		wallet.writeContract({
			address: RIPS_ADDRESS,
			abi: ripsAbi,
			functionName: 'buyTickets',
			args: [STAKE_ID, ticketCount, recipient],
			value: TICKET_COST * ticketCount,
		}),
		publicClient,
	)
}

async function claimPrizes(
	wallet: Wallet,
	roundId: bigint,
	recipient: Address,
	publicClient: PublicClient<HttpTransport, Chain>,
): Promise<void> {
	await waitForReceipt(
		wallet.writeContract({
			address: RIPS_ADDRESS,
			abi: ripsAbi,
			functionName: 'claimPrizes',
			args: [roundId, 0n, 100n, recipient, zeroAddress],
		}),
		publicClient,
	)
}

function sumPrizes(
	ticketCount: bigint,
	startTicketIndex: bigint,
	randoms: { a: bigint; b: bigint },
): bigint {
	const config = {
		id: 1,
		ticketCap: 8,
		feePercent: 0,
		ticketPrice: { currency: {} as never, amount: TICKET_COST },
		durationSeconds: 300,
		prizeDistribution: PRIZE_DISTRIBUTION,
	}

	let total = 0n

	for (let i = 0n; i < ticketCount; i++) {
		const ticketNumber = Number(startTicketIndex + i) + 1
		total += resolvePrize(
			ticketNumber,
			randoms,
			config,
			STUB_COLLECTIONS,
			[1, 1, 1],
		).prizeAmount
	}

	return total
}

const MAX_UINT64 = 2n ** 64n - 1n

function randomBigInt64(): bigint {
	return BigInt(Math.floor(Math.random() * Number(MAX_UINT64)))
}

function randomOddBigInt64(): bigint {
	const n = randomBigInt64()
	return n % 2n === 0n ? n + 1n : n
}

function randomBigIntInRange(min: bigint, max: bigint): bigint {
	return min + BigInt(Math.floor(Math.random() * Number(max - min + 1n)))
}
