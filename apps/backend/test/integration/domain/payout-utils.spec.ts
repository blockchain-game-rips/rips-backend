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
	resolveOnchainPayout,
	resolvePayout,
} from '../../../src/domain/services/payout-utils'
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
const PRESET_ID = 1n
const ENTRY_COST = parseEther('0.005')
const USER_1_ENTRY_COUNT = 6n
const USER_2_ENTRY_COUNT = 2n

const KEEPER_PRIVATE_KEY = ANVIL_ACCOUNT_0_PRIVATE_KEY
const USER_1_PRIVATE_KEY = ANVIL_ACCOUNT_1_PRIVATE_KEY
const USER_2_PRIVATE_KEY = ANVIL_ACCOUNT_2_PRIVATE_KEY

const PAYOUT_DISTRIBUTION = [
	{
		payoutCount: 5n,
		minPayout: parseEther('0.0008'),
		maxPayout: parseEther('0.0012'),
	},
	{
		payoutCount: 2n,
		minPayout: parseEther('0.007'),
		maxPayout: parseEther('0.008'),
	},
	{
		payoutCount: 1n,
		minPayout: parseEther('0.018'),
		maxPayout: parseEther('0.018'),
	},
]

const STUB_CARD: CardCollection = [
	{ card: { id: 1, name: 'Stub', tier: 1, imageUrl: '' }, count: 1 },
]
const STUB_COLLECTIONS: CardCollection[] = [STUB_CARD, STUB_CARD, STUB_CARD]

describe('payout-utils: resolvePayout matches on-chain balance diff', () => {
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

	describe('given users bought entries, VRF fulfilled, and payouts claimed', () => {
		beforeAll(async () => {
			const user1Wallet = makeWallet(USER_1_PRIVATE_KEY)
			const user2Wallet = makeWallet(USER_2_PRIVATE_KEY)
			const keeperWallet = makeWallet(KEEPER_PRIVATE_KEY)

			const ripId = 1n

			user1Address = user1Wallet.account.address
			user2Address = user2Wallet.account.address

			await buyEntries(
				user1Wallet,
				user1Address,
				USER_1_ENTRY_COUNT,
				publicClient,
			)
			await buyEntries(
				user2Wallet,
				user2Address,
				USER_2_ENTRY_COUNT,
				publicClient,
			)

			const vrfReceipt = await waitForReceipt(
				keeperWallet.writeContract({
					address: RIPS_ADDRESS,
					abi: ripsAbi,
					functionName: 'requestRandomness',
					args: [ripId],
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

			await claimPayouts(keeperWallet, ripId, user1Address, publicClient)
			await claimPayouts(keeperWallet, ripId, user2Address, publicClient)
		})

		it('balance diff equals sum of resolvePayout for each user', async () => {
			const [user1BalanceAfter, user2BalanceAfter] = await getBalances(
				[user1Address, user2Address],
				publicClient,
			)

			const randoms = { a: randomA, b: randomB }

			const user1ExpectedPayout = sumPayouts(
				USER_1_ENTRY_COUNT,
				0n,
				randoms,
			)
			const user2ExpectedPayout = sumPayouts(
				USER_2_ENTRY_COUNT,
				USER_1_ENTRY_COUNT,
				randoms,
			)

			expect(user1BalanceAfter - user1BalanceBefore).toBe(
				user1ExpectedPayout,
			)
			expect(user2BalanceAfter - user2BalanceBefore).toBe(
				user2ExpectedPayout,
			)
		})
	})

	describe('fuzz: resolvePayout matches on-chain calculateEntryPayout', () => {
		const FUZZ_N = 1024n
		const FUZZ_ITERATIONS = 100

		const FUZZ_PAYOUT_DISTRIBUTION = [
			{
				payoutCount: 500n,
				minPayout: parseEther('0.0001'),
				maxPayout: parseEther('0.0005'),
			},
			{
				payoutCount: 250n,
				minPayout: parseEther('0.001'),
				maxPayout: parseEther('0.002'),
			},
			{
				payoutCount: 150n,
				minPayout: parseEther('0.005'),
				maxPayout: parseEther('0.008'),
			},
			{
				payoutCount: 75n,
				minPayout: parseEther('0.01'),
				maxPayout: parseEther('0.015'),
			},
			{
				payoutCount: 35n,
				minPayout: parseEther('0.03'),
				maxPayout: parseEther('0.05'),
			},
			{
				payoutCount: 10n,
				minPayout: parseEther('0.1'),
				maxPayout: parseEther('0.15'),
			},
			{
				payoutCount: 4n,
				minPayout: parseEther('0.5'),
				maxPayout: parseEther('1.0'),
			},
		]

		const FUZZ_TIER_BOUNDARIES: bigint[] = FUZZ_PAYOUT_DISTRIBUTION.reduce<
			bigint[]
		>((acc, tier) => [...acc, (acc.at(-1) ?? 0n) + tier.payoutCount], [])

		const harnessAbi = [
			{
				type: 'function',
				name: 'exposed_calculateEntryPayout',
				inputs: [
					{
						name: 'entryNumber',
						type: 'uint256',
						internalType: 'uint256',
					},
					{ name: 'a', type: 'uint64', internalType: 'uint64' },
					{ name: 'b', type: 'uint64', internalType: 'uint64' },
					{ name: 'n', type: 'uint64', internalType: 'uint64' },
					{
						name: 'tiers',
						type: 'tuple[]',
						internalType: 'struct IRips.PayoutTier[]',
						components: [
							{
								name: 'payoutCount',
								type: 'uint64',
								internalType: 'uint64',
							},
							{
								name: 'minPayout',
								type: 'uint128',
								internalType: 'uint128',
							},
							{
								name: 'maxPayout',
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

		it('payoutAmount matches on-chain for random inputs', async () => {
			for (let i = 0; i < FUZZ_ITERATIONS; i++) {
				const a = randomOddBigInt64()
				const b = randomBigInt64()
				const entryNumber = randomBigIntInRange(1n, FUZZ_N)

				const payoutNumber = ((a * entryNumber + b) % FUZZ_N) + 1n

				const { payoutAmount } = resolveOnchainPayout(
					payoutNumber,
					FUZZ_PAYOUT_DISTRIBUTION,
				)

				const onChainPayout = await publicClient.readContract({
					address: RIPS_ADDRESS,
					abi: harnessAbi,
					functionName: 'exposed_calculateEntryPayout',
					args: [
						entryNumber,
						a,
						b,
						FUZZ_N,
						FUZZ_PAYOUT_DISTRIBUTION,
						FUZZ_TIER_BOUNDARIES,
					],
				})

				if (payoutAmount !== onChainPayout) {
					throw new Error(
						`a=${a} b=${b} entryNumber=${entryNumber}: ts=${payoutAmount} onChain=${onChainPayout}`,
					)
				}
			}
		})
	})
})

type Wallet = WalletClient<HttpTransport, Chain, Account>

async function buyEntries(
	wallet: Wallet,
	recipient: Address,
	entryCount: bigint,
	publicClient: PublicClient<HttpTransport, Chain>,
): Promise<void> {
	await waitForReceipt(
		wallet.writeContract({
			address: RIPS_ADDRESS,
			abi: ripsAbi,
			functionName: 'enterRip',
			args: [PRESET_ID, entryCount, recipient],
			value: ENTRY_COST * entryCount,
		}),
		publicClient,
	)
}

async function claimPayouts(
	wallet: Wallet,
	ripId: bigint,
	recipient: Address,
	publicClient: PublicClient<HttpTransport, Chain>,
): Promise<void> {
	await waitForReceipt(
		wallet.writeContract({
			address: RIPS_ADDRESS,
			abi: ripsAbi,
			functionName: 'claimPayout',
			args: [ripId, 0n, 100n, recipient, zeroAddress],
		}),
		publicClient,
	)
}

function sumPayouts(
	entryCount: bigint,
	startEntryIndex: bigint,
	randoms: { a: bigint; b: bigint },
): bigint {
	const config = {
		id: 1,
		entryCap: 8,
		feePercent: 0,
		entryPrice: { currency: {} as never, amount: ENTRY_COST },
		durationSeconds: 300,
		payoutDistribution: PAYOUT_DISTRIBUTION,
	}

	let total = 0n

	for (let i = 0n; i < entryCount; i++) {
		const entryNumber = Number(startEntryIndex + i) + 1
		total += resolvePayout(
			entryNumber,
			randoms,
			config,
			STUB_COLLECTIONS,
			[1, 1, 1],
		).payoutAmount
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
