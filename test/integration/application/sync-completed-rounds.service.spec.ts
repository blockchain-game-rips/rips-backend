import { Test } from '@nestjs/testing'
import { parseEther } from 'viem'
import { RoundRepository } from '../../../src/application/interfaces/repositories/round.repository'
import { STAKE_TO_TIER_BIASES } from '../../../src/application/interfaces/tokens'
import { SyncCompletedRoundsService } from '../../../src/application/use-cases/sync-completed-rounds/sync-completed-rounds.service'
import { SyncCompletedRoundsUseCase } from '../../../src/application/use-cases/sync-completed-rounds/sync-completed-rounds.use-case'
import { Config } from '../../../src/domain/entities/config'
import { CompletedRound, RoundStatus } from '../../../src/domain/entities/round'
import { Stake } from '../../../src/domain/entities/stake'
import { toEvmAddress } from '../../../src/domain/value-objects/evm-address'
import { NotificationType } from '../../../generated/prisma'
import { PrismaModule } from '../../../src/infrastructure/prisma/prisma.module'
import { PrismaService } from '../../../src/infrastructure/prisma/prisma.service'
import { MOCK_CURRENCY } from '../../fixtures/entities'
import { MockRoundRepository } from '../../mocks/mock-indexer.module'
import { usePostgres } from '../../utils/postgres'

const STAKE_ID = 1
const CLAIMED_ROUND_ID = 42
const REFUNDED_ROUND_ID = 43

const STAKE_CONFIG: Config = {
	id: 1,
	ticketCap: 8,
	feePercent: 0,
	ticketPrice: { currency: MOCK_CURRENCY, amount: parseEther('0.005') },
	durationSeconds: 300,
	prizeDistribution: [
		{
			prizeCount: 8n,
			minPrize: parseEther('0.001'),
			maxPrize: parseEther('0.01'),
		},
	],
}

const STAKE: Stake = {
	id: STAKE_ID,
	currentConfig: STAKE_CONFIG,
}

const USER_A_ADDRESS = toEvmAddress(
	'0x1111111111111111111111111111111111111111',
)
const USER_B_ADDRESS = toEvmAddress(
	'0x2222222222222222222222222222222222222222',
)
const USER_C_ADDRESS = toEvmAddress(
	'0x3333333333333333333333333333333333333333',
)

describe('SyncCompletedRoundsService integration', () => {
	usePostgres()

	let service: SyncCompletedRoundsUseCase
	let prisma: PrismaService
	let roundRepository: MockRoundRepository

	beforeAll(async () => {
		roundRepository = new MockRoundRepository()

		const moduleRef = await Test.createTestingModule({
			imports: [PrismaModule],
			providers: [
				{
					provide: SyncCompletedRoundsUseCase,
					useClass: SyncCompletedRoundsService,
				},
				{ provide: RoundRepository, useValue: roundRepository },
				{
					provide: STAKE_TO_TIER_BIASES,
					useValue: new Map([[STAKE_ID, [2]]]),
				},
			],
		}).compile()

		service = moduleRef.get(SyncCompletedRoundsUseCase)
		prisma = moduleRef.get(PrismaService)

		await seedCardDefinitions(prisma)
		await seedUsers(prisma)
	})

	it('claimed round with 3 purchasers (2 with telegram, 1 without) writes 8 prizes, 3 notifications, 1 synced round', async () => {
		const round: CompletedRound = {
			id: CLAIMED_ROUND_ID,
			stake: STAKE,
			config: STAKE_CONFIG,
			currency: MOCK_CURRENCY,
			status: RoundStatus.CLAIMED,
			startTime: new Date(),
			randoms: { a: 3n, b: 1n },
			actions: {
				purchases: [
					{
						userAddress: USER_A_ADDRESS,
						ticketCount: 2n,
						startTicketIndex: 0n,
					},
					{
						userAddress: USER_B_ADDRESS,
						ticketCount: 1n,
						startTicketIndex: 2n,
					},
					{
						userAddress: USER_C_ADDRESS,
						ticketCount: 5n,
						startTicketIndex: 3n,
					},
				],
				claims: [],
				refunds: [],
			},
		}

		roundRepository.setNextCompletedRound(round)
		await service.execute()

		const prizes = await prisma.ticketPrize.findMany({
			where: { roundId: CLAIMED_ROUND_ID },
		})
		const notifications = await prisma.notification.findMany({
			where: { roundId: CLAIMED_ROUND_ID },
		})
		const syncedRounds = await prisma.syncedRound.findMany({
			where: { roundId: CLAIMED_ROUND_ID },
		})

		expect(prizes).toHaveLength(8)
		expect(prizes.every((p) => p.roundId === CLAIMED_ROUND_ID)).toBe(true)

		const prizesByAddress = {
			[USER_A_ADDRESS]: prizes.filter(
				(p) => p.userAddress === USER_A_ADDRESS,
			),
			[USER_B_ADDRESS]: prizes.filter(
				(p) => p.userAddress === USER_B_ADDRESS,
			),
			[USER_C_ADDRESS]: prizes.filter(
				(p) => p.userAddress === USER_C_ADDRESS,
			),
		}
		expect(prizesByAddress[USER_A_ADDRESS]).toHaveLength(2)
		expect(prizesByAddress[USER_B_ADDRESS]).toHaveLength(1)
		expect(prizesByAddress[USER_C_ADDRESS]).toHaveLength(5)

		expect(notifications).toHaveLength(3)
		expect(notifications.every((n) => n.roundId === CLAIMED_ROUND_ID)).toBe(
			true,
		)
		expect(
			notifications.every((n) => n.type === NotificationType.CLAIMED),
		).toBe(true)

		const userNotifications = notifications.filter((n) => n.userId !== 0n)
		const globalNotifications = notifications.filter((n) => n.userId === 0n)

		expect(userNotifications).toHaveLength(2)
		expect(userNotifications.map((n) => n.userId).sort()).toEqual([1n, 2n])
		expect(globalNotifications).toHaveLength(1)

		expect(syncedRounds).toHaveLength(1)
		expect(syncedRounds[0].roundId).toBe(CLAIMED_ROUND_ID)
	})

	it('refunded round with 3 purchasers (2 with telegram, 1 without) writes 2 user notifications, 1 synced round', async () => {
		const round: CompletedRound = {
			id: REFUNDED_ROUND_ID,
			stake: STAKE,
			config: STAKE_CONFIG,
			currency: MOCK_CURRENCY,
			status: RoundStatus.REFUNDED,
			startTime: new Date(),
			actions: {
				purchases: [
					{
						userAddress: USER_A_ADDRESS,
						ticketCount: 2n,
						startTicketIndex: 0n,
					},
					{
						userAddress: USER_B_ADDRESS,
						ticketCount: 1n,
						startTicketIndex: 2n,
					},
					{
						userAddress: USER_C_ADDRESS,
						ticketCount: 5n,
						startTicketIndex: 3n,
					},
				],
				claims: [],
				refunds: [
					{ userAddress: USER_A_ADDRESS, amount: parseEther('0.01') },
					{
						userAddress: USER_B_ADDRESS,
						amount: parseEther('0.005'),
					},
					{
						userAddress: USER_C_ADDRESS,
						amount: parseEther('0.025'),
					},
				],
			},
		}

		roundRepository.setNextCompletedRound(round)
		await service.execute()

		const notifications = await prisma.notification.findMany({
			where: { roundId: REFUNDED_ROUND_ID },
		})
		const syncedRounds = await prisma.syncedRound.findMany({
			where: { roundId: REFUNDED_ROUND_ID },
		})

		expect(notifications).toHaveLength(2)
		expect(
			notifications.every((n) => n.roundId === REFUNDED_ROUND_ID),
		).toBe(true)
		expect(
			notifications.every((n) => n.type === NotificationType.REFUNDED),
		).toBe(true)
		expect(notifications.map((n) => n.userId).sort()).toEqual([1n, 2n])

		expect(syncedRounds).toHaveLength(1)
		expect(syncedRounds[0].roundId).toBe(REFUNDED_ROUND_ID)
	})
})

async function seedCardDefinitions(prisma: PrismaService): Promise<void> {
	await prisma.cardDefinition.create({
		data: {
			stakeId: STAKE_ID,
			tier: 0,
			name: 'Test Card',
			imageUrl: 'https://example.com/card.png',
		},
	})
}

async function seedUsers(prisma: PrismaService): Promise<void> {
	await prisma.user.create({
		data: {
			telegramId: 111n,
			evmWallet: {
				create: { address: USER_A_ADDRESS, kmsKeyId: 'kms-a' },
			},
		},
	})

	await prisma.user.create({
		data: {
			telegramId: 222n,
			evmWallet: {
				create: { address: USER_B_ADDRESS, kmsKeyId: 'kms-b' },
			},
		},
	})
}
