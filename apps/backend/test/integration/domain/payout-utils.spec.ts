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
import { RandomnessFulfillment } from '../../../src/domain/entities/rip'
import { deriveCardEntropy } from '../../../src/domain/services/card-entropy'
import {
	resolveOnchainPayout,
	resolvePayout,
	resolveRandomCard,
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

const STUB_POSITION = { blockNumber: 1n, logIndex: 0 }

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

const DRAW_RANDOMS = { a: 7n, b: 11n }
const DRAW_ENTRY_NUMBER = 1

const DRAW_KEY: RandomnessFulfillment = {
	randoms: DRAW_RANDOMS,
	blockNumber: 500n,
	logIndex: 2,
}

const OTHER_DRAW_KEY: RandomnessFulfillment = {
	randoms: DRAW_RANDOMS,
	blockNumber: 500n,
	logIndex: 3,
}

const DRAW_TIER = 0
const DRAW_CARDS_IN_TIER = 4
const DRAW_BIAS = 2n
const NO_BIAS = 0n
const DRAW_SAMPLES = 400

const MAX_ENTROPY = 2n ** 256n - 1n
const ZERO_ENTROPY = 0n

function drawCollection(ownedIndices: number[] = []): CardCollection {
	return Array.from({ length: DRAW_CARDS_IN_TIER }, (_, i) => ({
		card: {
			id: i + 1,
			tier: DRAW_TIER,
			name: `draw-card-${i}`,
			imageUrl: '',
		},
		count: ownedIndices.includes(i) ? 1 : 0,
	}))
}

function drawEntropy(
	entryNumber: number,
	fulfillment: RandomnessFulfillment,
): bigint {
	return deriveCardEntropy({ fulfillment, entryNumber })
}

function drawCard(
	collection: CardCollection,
	entryNumber: number,
	fulfillment: RandomnessFulfillment,
	bias: bigint = DRAW_BIAS,
) {
	return resolveRandomCard(
		collection,
		bias,
		drawEntropy(entryNumber, fulfillment),
	)
}

describe('payout-utils: card draws are deterministic', () => {
	it('gives the same card for the same inputs', () => {
		const first = drawCard(drawCollection(), DRAW_ENTRY_NUMBER, DRAW_KEY)
		const second = drawCard(drawCollection(), DRAW_ENTRY_NUMBER, DRAW_KEY)

		expect(first.id).toBe(second.id)
	})

	it('decorrelates entry numbers under the same randoms', () => {
		const drawn = new Set(
			Array.from(
				{ length: DRAW_SAMPLES },
				(_, i) => drawCard(drawCollection(), i + 1, DRAW_KEY).id,
			),
		)

		expect(drawn.size).toBe(DRAW_CARDS_IN_TIER)
	})

	it('decorrelates settlement keys under the same randoms and entry', () => {
		const drawn = new Set<number>()

		for (let logIndex = 0; logIndex < DRAW_SAMPLES; logIndex++) {
			drawn.add(
				drawCard(drawCollection(), DRAW_ENTRY_NUMBER, {
					...DRAW_KEY,
					logIndex,
				}).id,
			)
		}

		expect(drawn.size).toBe(DRAW_CARDS_IN_TIER)
	})

	it('is sensitive to the settlement key alone', () => {
		const drawnKeys = new Set(
			[DRAW_KEY, OTHER_DRAW_KEY].map((key) =>
				drawEntropy(DRAW_ENTRY_NUMBER, key),
			),
		)

		expect(drawnKeys.size).toBe(2)
	})

	describe('boost', () => {
		it('favours unseen cards while the collection is incomplete', () => {
			const allButLastOwned = [0, 1, 2]

			let unseenHits = 0

			for (let i = 0; i < DRAW_SAMPLES; i++) {
				const card = drawCard(
					drawCollection(allButLastOwned),
					i + 1,
					DRAW_KEY,
				)

				if (card.id === DRAW_CARDS_IN_TIER) unseenHits++
			}

			expect(unseenHits).toBeGreaterThan(
				DRAW_SAMPLES / DRAW_CARDS_IN_TIER,
			)
		})

		it('spreads evenly once every card is owned', () => {
			const allOwned = [0, 1, 2, 3]
			const hits = new Map<number, number>()

			for (let i = 0; i < DRAW_SAMPLES; i++) {
				const card = drawCard(drawCollection(allOwned), i + 1, DRAW_KEY)

				hits.set(card.id, (hits.get(card.id) ?? 0) + 1)
			}

			const expectedShare = DRAW_SAMPLES / DRAW_CARDS_IN_TIER
			const tolerance = expectedShare / 2

			for (const count of hits.values()) {
				expect(Math.abs(count - expectedShare)).toBeLessThan(tolerance)
			}
		})
	})

	describe('a single-card tier', () => {
		const singleCard: CardCollection = [
			{
				card: { id: 1, tier: DRAW_TIER, name: 'only', imageUrl: '' },
				count: 1,
			},
		]

		it('returns that card when it is already owned and unboosted', () => {
			const card = resolveRandomCard(
				singleCard,
				NO_BIAS,
				drawEntropy(DRAW_ENTRY_NUMBER, DRAW_KEY),
			)

			expect(card.id).toBe(1)
		})
	})

	describe('a card outside the rip revision', () => {
		it('never drops and does not count towards the tier size', () => {
			// The revision governs the draw, so a card missing from it simply
			// is not in the collection handed to resolveRandomCard.
			const inRevision = drawCollection().slice(0, 3)

			const drawn = new Set(
				Array.from(
					{ length: DRAW_SAMPLES },
					(_, i) => drawCard(inRevision, i + 1, DRAW_KEY).id,
				),
			)

			expect(drawn.size).toBe(inRevision.length)
			expect(drawn).not.toContain(DRAW_CARDS_IN_TIER)
		})

		it('keeps k from exceeding n when the player owns one', () => {
			// A player holding every card of a 3-card revision has k === n, so
			// the boost collapses to 1 and no weight can go negative.
			const everyCardOwned = drawCollection([0, 1, 2]).slice(0, 3)

			const card = drawCard(everyCardOwned, DRAW_ENTRY_NUMBER, DRAW_KEY)

			expect(everyCardOwned.map((c) => c.card.id)).toContain(card.id)
		})
	})

	describe('entropy at the range boundaries', () => {
		it.each([
			['zero', ZERO_ENTROPY],
			['max', MAX_ENTROPY],
		])('returns a card in the tier for %s entropy', (_label, entropy) => {
			const collection = drawCollection()

			const card = resolveRandomCard(collection, DRAW_BIAS, entropy)

			expect(collection.map((c) => c.card.id)).toContain(card.id)
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
			args: [ripId, 100n, recipient, zeroAddress],
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
		feeBps: 0,
		entryPrice: { currency: {} as never, amount: ENTRY_COST },
		durationSeconds: 300,
		payoutDistribution: PAYOUT_DISTRIBUTION,
	}

	let total = 0n

	for (let i = 0n; i < entryCount; i++) {
		const entryNumber = Number(startEntryIndex + i) + 1
		total += resolvePayout({
			entryNumber,
			fulfillment: { randoms, ...STUB_POSITION },
			config,
			cardCollections: STUB_COLLECTIONS,
			tierBiases: [1n, 1n, 1n],
		}).payoutAmount
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
