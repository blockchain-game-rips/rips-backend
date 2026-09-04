import { Histogram } from 'prom-client'
import {
	EvmAddress,
	toEvmAddress,
} from '../../../src/domain/value-objects/evm-address'
import { SettlementKey } from '../../../src/domain/value-objects/settlement-key'
import { PrismaEntryPayoutRepository } from '../../../src/infrastructure/prisma/entry-payout.repository'
import { PrismaService } from '../../../src/infrastructure/prisma/prisma.service'
import { usePostgres } from '../../utils/postgres'

const USER_ADDRESS = toEvmAddress('0x1111111111111111111111111111111111111111')

const OTHER_USER_ADDRESS = toEvmAddress(
	'0x2222222222222222222222222222222222222222',
)

const TIER = 0

const FIRST_CARD_ID = 1
const SECOND_CARD_ID = 2

const SETTLE_BLOCK = 100n
const EARLIER_SETTLE_BLOCK = 99n
const LATER_SETTLE_BLOCK = 101n

/** One rip per settlement block, since the block now lives on the rip. */
const RIP_ID_BY_SETTLE_BLOCK = new Map([
	[EARLIER_SETTLE_BLOCK, 1],
	[SETTLE_BLOCK, 2],
	[LATER_SETTLE_BLOCK, 3],
])

/** Every draw in these tests happens as if the rip settled at this key. */
const DRAW_KEY: SettlementKey = { blockNumber: SETTLE_BLOCK, logIndex: 0 }

const NO_PAYOUTS = 0
const ONE_PAYOUT = 1
const TWO_PAYOUTS = 2

const PAYOUT_AMOUNT = 1000n

describe('PrismaEntryPayoutRepository card collections', () => {
	usePostgres()

	let prisma: PrismaService
	let repository: PrismaEntryPayoutRepository

	beforeAll(async () => {
		const queryDuration = {
			observe: vi.fn(),
		} as unknown as Histogram<string>

		prisma = new PrismaService(queryDuration)
		await prisma.$connect()

		repository = new PrismaEntryPayoutRepository(prisma)
	})

	afterAll(async () => {
		await prisma.$disconnect()
	})

	beforeEach(async () => {
		await prisma.entryPayout.deleteMany()
		await prisma.syncedRip.deleteMany()
		await prisma.cardDefinition.deleteMany()

		for (const [settleBlockNumber, ripId] of RIP_ID_BY_SETTLE_BLOCK) {
			await prisma.syncedRip.create({
				data: { ripId, settleBlockNumber, settleLogIndex: 0 },
			})
		}
	})

	async function createCard(id: number, name: string): Promise<bigint> {
		const card = await prisma.cardDefinition.create({
			data: { id: BigInt(id), tier: TIER, name, imageUrl: `${name}.png` },
		})

		return card.id
	}

	async function createPayout(
		cardDefinitionId: bigint,
		entryNumber: number,
		revealed: boolean,
		userAddress: EvmAddress = USER_ADDRESS,
		settleBlockNumber: bigint = EARLIER_SETTLE_BLOCK,
	): Promise<void> {
		const ripId = RIP_ID_BY_SETTLE_BLOCK.get(settleBlockNumber)

		if (ripId === undefined)
			throw new Error(`No rip seeded for block ${settleBlockNumber}`)

		await prisma.entryPayout.create({
			data: {
				userAddress,
				ripId,
				entryNumber,
				payoutAmount: PAYOUT_AMOUNT,
				cardDefinitionId,
				revealed,
			},
		})
	}

	it('counts only revealed payouts for the revealed collection', async () => {
		const cardId = await createCard(FIRST_CARD_ID, 'Revealed card')

		await createPayout(cardId, 1, true)
		await createPayout(cardId, 2, false)

		const [tier] = await repository.getRevealedCardCollections(USER_ADDRESS)

		expect(tier).toEqual([expect.objectContaining({ count: ONE_PAYOUT })])
	})

	it('counts revealed and unrevealed payouts for the assigned collection', async () => {
		const cardId = await createCard(FIRST_CARD_ID, 'Assigned card')

		await createPayout(cardId, 1, true)
		await createPayout(cardId, 2, false)

		const [tier] = await repository.getAssignedCardCollections(
			USER_ADDRESS,
			DRAW_KEY,
		)

		expect(tier).toEqual([expect.objectContaining({ count: TWO_PAYOUTS })])
	})

	it('ignores payouts belonging to another user', async () => {
		const cardId = await createCard(FIRST_CARD_ID, 'Shared card')

		await createPayout(cardId, 1, true)
		await createPayout(cardId, 2, true, OTHER_USER_ADDRESS)

		const [tier] = await repository.getRevealedCardCollections(USER_ADDRESS)

		expect(tier).toEqual([expect.objectContaining({ count: ONE_PAYOUT })])
	})

	it('includes cards the user has no payouts for', async () => {
		const ownedCardId = await createCard(FIRST_CARD_ID, 'Owned card')
		await createCard(SECOND_CARD_ID, 'Unowned card')

		await createPayout(ownedCardId, 1, true)

		const [tier] = await repository.getRevealedCardCollections(USER_ADDRESS)

		expect(tier).toEqual([
			expect.objectContaining({
				card: expect.objectContaining({ name: 'Owned card' }),
				count: ONE_PAYOUT,
			}),
			expect.objectContaining({
				card: expect.objectContaining({ name: 'Unowned card' }),
				count: NO_PAYOUTS,
			}),
		])
	})

	it('excludes payouts from rips that settled at or after the draw', async () => {
		const cardId = await createCard(FIRST_CARD_ID, 'Later card')

		await createPayout(cardId, 1, false, USER_ADDRESS, EARLIER_SETTLE_BLOCK)
		await createPayout(cardId, 2, false, USER_ADDRESS, SETTLE_BLOCK)
		await createPayout(cardId, 3, false, USER_ADDRESS, LATER_SETTLE_BLOCK)

		const [tier] = await repository.getAssignedCardCollections(
			USER_ADDRESS,
			DRAW_KEY,
		)

		expect(tier).toEqual([expect.objectContaining({ count: ONE_PAYOUT })])
	})
})
