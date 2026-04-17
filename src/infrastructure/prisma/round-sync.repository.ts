import { Injectable } from '@nestjs/common'
import {
	RoundSyncRepository,
	UserPrizes,
} from '../../application/interfaces/repositories/round-sync.repository'
import { NotificationType } from '../../generated/prisma'
import { PrismaService } from './prisma.service'

const GROUP_USER_ID = 0n

@Injectable()
export class PrismaRoundSyncRepository extends RoundSyncRepository {
	constructor(private readonly prisma: PrismaService) {
		super()
	}

	async getHighestSyncedRoundId(): Promise<number | null> {
		const result = await this.prisma.syncedRound.findFirst({
			orderBy: { roundId: 'desc' },
			select: { roundId: true },
		})

		return result?.roundId ?? null
	}

	async syncClaimedRound(args: {
		roundId: number
		entries: UserPrizes[]
	}): Promise<void> {
		const { roundId, entries } = args

		await this.prisma.$transaction([
			...entries.flatMap(({ userId, prizes }) =>
				prizes.map((prize) =>
					this.prisma.ticketPrize.create({
						data: {
							userId,
							roundId: prize.roundId,
							ticketNumber: prize.ticketNumber,
							prizeAmount: prize.prizeAmount,
							cardDefinitionId: BigInt(prize.card.id),
						},
					}),
				),
			),
			...entries.map(({ userId }) =>
				this.prisma.notification.create({
					data: { userId, roundId, type: NotificationType.CLAIMED },
				}),
			),
			this.prisma.notification.create({
				data: {
					userId: GROUP_USER_ID,
					roundId,
					type: NotificationType.CLAIMED,
				},
			}),
			this.prisma.syncedRound.create({ data: { roundId } }),
		])
	}

	async syncRefundedRound(args: {
		roundId: number
		userIds: bigint[]
	}): Promise<void> {
		const { roundId, userIds } = args

		await this.prisma.$transaction([
			...userIds.map((userId) =>
				this.prisma.notification.create({
					data: { userId, roundId, type: NotificationType.REFUNDED },
				}),
			),
			this.prisma.syncedRound.create({ data: { roundId } }),
		])
	}
}
