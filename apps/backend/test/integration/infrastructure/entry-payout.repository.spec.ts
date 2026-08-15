import { Histogram } from 'prom-client'
import {
	EvmAddress,
	toEvmAddress,
} from '../../../src/domain/value-objects/evm-address'
import { PrismaEntryPayoutRepository } from '../../../src/infrastructure/prisma/entry-payout.repository'
import { PrismaService } from '../../../src/infrastructure/prisma/prisma.service'
import { usePostgres } from '../../utils/postgres'

const USER_ADDRESS = toEvmAddress('0x1111111111111111111111111111111111111111')

const OTHER_USER_ADDRESS = toEvmAddress(
	'0x2222222222222222222222222222222222222222',
)

const TIER = 0
const RIP_ID = 1

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
			observe: jest.fn(),
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
		await prisma.cardDefinition.deleteMany()
	})

	async function createCard(name: string): Promise<bigint> {
		const card = await prisma.cardDefinition.create({
			data: { tier: TIER, name, imageUrl: `${name}.png` },
		})

		return card.id
	}

	async function createPayout(
		cardDefinitionId: bigint,
		entryNumber: number,
		revealed: boolean,
		userAddress: EvmAddress = USER_ADDRESS,
	): Promise<void> {
		await prisma.entryPayout.create({
			data: {
				userAddress,
				ripId: RIP_ID,
				entryNumber,
				payoutAmount: PAYOUT_AMOUNT,
				cardDefinitionId,
				revealed,
			},
		})
	}

	it('counts only revealed payouts for the revealed collection', async () => {
		const cardId = await createCard('Revealed card')

		await createPayout(cardId, 1, true)
		await createPayout(cardId, 2, false)

		const [tier] = await repository.getRevealedCardCollections(USER_ADDRESS)

		expect(tier).toEqual([expect.objectContaining({ count: ONE_PAYOUT })])
	})

	it('counts revealed and unrevealed payouts for the assigned collection', async () => {
		const cardId = await createCard('Assigned card')

		await createPayout(cardId, 1, true)
		await createPayout(cardId, 2, false)

		const [tier] = await repository.getAssignedCardCollections(USER_ADDRESS)

		expect(tier).toEqual([expect.objectContaining({ count: TWO_PAYOUTS })])
	})

	it('ignores payouts belonging to another user', async () => {
		const cardId = await createCard('Shared card')

		await createPayout(cardId, 1, true)
		await createPayout(cardId, 2, true, OTHER_USER_ADDRESS)

		const [tier] = await repository.getRevealedCardCollections(USER_ADDRESS)

		expect(tier).toEqual([expect.objectContaining({ count: ONE_PAYOUT })])
	})

	it('includes cards the user has no payouts for', async () => {
		const ownedCardId = await createCard('Owned card')
		await createCard('Unowned card')

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
})
