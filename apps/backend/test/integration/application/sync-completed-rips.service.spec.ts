import { Test } from '@nestjs/testing'
import { parseEther } from 'viem'
import { NotificationType } from '../../../generated/prisma'
import { RipRepository } from '../../../src/application/interfaces/repositories/rip.repository'
import { PRESET_TO_TIER_BIASES } from '../../../src/application/interfaces/tokens'
import { SyncCompletedRipsService } from '../../../src/application/use-cases/sync-completed-rips/sync-completed-rips.service'
import { SyncCompletedRipsUseCase } from '../../../src/application/use-cases/sync-completed-rips/sync-completed-rips.use-case'
import { Config } from '../../../src/domain/entities/config'
import { Preset } from '../../../src/domain/entities/preset'
import { CompletedRip, RipStatus } from '../../../src/domain/entities/rip'
import { toEvmAddress } from '../../../src/domain/value-objects/evm-address'
import { PrismaModule } from '../../../src/infrastructure/prisma/prisma.module'
import { PrismaService } from '../../../src/infrastructure/prisma/prisma.service'
import { MOCK_CURRENCY } from '../../fixtures/entities'
import { MockRipRepository } from '../../mocks/mock-indexer.module'
import { usePostgres } from '../../utils/postgres'

const PRESET_ID = 1
const CLAIMED_RIP_ID = 42
const REFUNDED_RIP_ID = 43

const PRESET_CONFIG: Config = {
	id: 1,
	entryCap: 8,
	feePercent: 0,
	entryPrice: { currency: MOCK_CURRENCY, amount: parseEther('0.005') },
	durationSeconds: 300,
	payoutDistribution: [
		{
			payoutCount: 8n,
			minPayout: parseEther('0.001'),
			maxPayout: parseEther('0.01'),
		},
	],
}

const PRESET: Preset = {
	id: PRESET_ID,
	currentConfig: PRESET_CONFIG,
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

describe('SyncCompletedRipsService integration', () => {
	usePostgres()

	let service: SyncCompletedRipsUseCase
	let prisma: PrismaService
	let ripRepository: MockRipRepository

	beforeAll(async () => {
		ripRepository = new MockRipRepository()

		const moduleRef = await Test.createTestingModule({
			imports: [PrismaModule],
			providers: [
				{
					provide: SyncCompletedRipsUseCase,
					useClass: SyncCompletedRipsService,
				},
				{ provide: RipRepository, useValue: ripRepository },
				{
					provide: PRESET_TO_TIER_BIASES,
					useValue: new Map([[PRESET_ID, [2]]]),
				},
			],
		}).compile()

		service = moduleRef.get(SyncCompletedRipsUseCase)
		prisma = moduleRef.get(PrismaService)

		await seedCardDefinitions(prisma)
		await seedUsers(prisma)
	})

	it('claimed rip with 3 purchasers (2 with telegram, 1 without) writes 8 payouts, 3 notifications, 1 synced rip', async () => {
		const rip: CompletedRip = {
			id: CLAIMED_RIP_ID,
			preset: PRESET,
			config: PRESET_CONFIG,
			currency: MOCK_CURRENCY,
			status: RipStatus.CLAIMED,
			startTime: new Date(),
			randoms: { a: 3n, b: 1n },
			actions: {
				purchases: [
					{
						userAddress: USER_A_ADDRESS,
						entryCount: 2n,
						startEntryIndex: 0n,
					},
					{
						userAddress: USER_B_ADDRESS,
						entryCount: 1n,
						startEntryIndex: 2n,
					},
					{
						userAddress: USER_C_ADDRESS,
						entryCount: 5n,
						startEntryIndex: 3n,
					},
				],
				claims: [],
				refunds: [],
			},
		}

		ripRepository.setNextCompletedRip(rip)
		await service.execute()

		const payouts = await prisma.entryPayout.findMany({
			where: { ripId: CLAIMED_RIP_ID },
		})
		const notifications = await prisma.notification.findMany({
			where: { ripId: CLAIMED_RIP_ID },
		})
		const syncedRips = await prisma.syncedRip.findMany({
			where: { ripId: CLAIMED_RIP_ID },
		})

		expect(payouts).toHaveLength(8)
		expect(payouts.every((p) => p.ripId === CLAIMED_RIP_ID)).toBe(true)

		const payoutsByAddress = {
			[USER_A_ADDRESS]: payouts.filter(
				(p) => p.userAddress === USER_A_ADDRESS,
			),
			[USER_B_ADDRESS]: payouts.filter(
				(p) => p.userAddress === USER_B_ADDRESS,
			),
			[USER_C_ADDRESS]: payouts.filter(
				(p) => p.userAddress === USER_C_ADDRESS,
			),
		}
		expect(payoutsByAddress[USER_A_ADDRESS]).toHaveLength(2)
		expect(payoutsByAddress[USER_B_ADDRESS]).toHaveLength(1)
		expect(payoutsByAddress[USER_C_ADDRESS]).toHaveLength(5)

		expect(notifications).toHaveLength(3)
		expect(notifications.every((n) => n.ripId === CLAIMED_RIP_ID)).toBe(
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

		expect(syncedRips).toHaveLength(1)
		expect(syncedRips[0].ripId).toBe(CLAIMED_RIP_ID)
	})

	it('refunded rip with 3 purchasers (2 with telegram, 1 without) writes 2 user notifications, 1 synced rip', async () => {
		const rip: CompletedRip = {
			id: REFUNDED_RIP_ID,
			preset: PRESET,
			config: PRESET_CONFIG,
			currency: MOCK_CURRENCY,
			status: RipStatus.REFUNDED,
			startTime: new Date(),
			actions: {
				purchases: [
					{
						userAddress: USER_A_ADDRESS,
						entryCount: 2n,
						startEntryIndex: 0n,
					},
					{
						userAddress: USER_B_ADDRESS,
						entryCount: 1n,
						startEntryIndex: 2n,
					},
					{
						userAddress: USER_C_ADDRESS,
						entryCount: 5n,
						startEntryIndex: 3n,
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

		ripRepository.setNextCompletedRip(rip)
		await service.execute()

		const notifications = await prisma.notification.findMany({
			where: { ripId: REFUNDED_RIP_ID },
		})
		const syncedRips = await prisma.syncedRip.findMany({
			where: { ripId: REFUNDED_RIP_ID },
		})

		expect(notifications).toHaveLength(2)
		expect(notifications.every((n) => n.ripId === REFUNDED_RIP_ID)).toBe(
			true,
		)
		expect(
			notifications.every((n) => n.type === NotificationType.REFUNDED),
		).toBe(true)
		expect(notifications.map((n) => n.userId).sort()).toEqual([1n, 2n])

		expect(syncedRips).toHaveLength(1)
		expect(syncedRips[0].ripId).toBe(REFUNDED_RIP_ID)
	})
})

async function seedCardDefinitions(prisma: PrismaService): Promise<void> {
	await prisma.cardDefinition.create({
		data: {
			presetId: PRESET_ID,
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
