import { Injectable } from '@nestjs/common'
import { RoundSyncRepository } from '../../application/interfaces/repositories/round-sync.repository'
import { TicketPrize } from '../../domain/value-objects/ticket-prize'
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
		prizes: TicketPrize[]
	}): Promise<void> {
		const { roundId, prizes } = args

		const uniqueUserAddresses = [
			...new Set(prizes.map((prize) => prize.userAddress)),
		]

		await this.prisma.$transaction(async (tx) => {
			const wallets = await tx.evmWallet.findMany({
				where: { address: { in: uniqueUserAddresses } },
				select: { userId: true },
			})

			await Promise.all([
				...prizes.map((prize) =>
					tx.ticketPrize.create({
						data: {
							userAddress: prize.userAddress,
							roundId: prize.roundId,
							ticketNumber: prize.ticketNumber,
							prizeAmount: prize.prizeAmount,
							cardDefinitionId: BigInt(prize.card.id),
						},
					}),
				),
				...wallets.map((wallet) =>
					tx.notification.create({
						data: {
							userId: wallet.userId,
							roundId,
							type: NotificationType.CLAIMED,
						},
					}),
				),
				tx.notification.create({
					data: {
						userId: GROUP_USER_ID,
						roundId,
						type: NotificationType.CLAIMED,
					},
				}),
				tx.syncedRound.create({ data: { roundId } }),
			])
		})
	}

	async syncRefundedRound(args: {
		roundId: number
		userIds: bigint[]
	}): Promise<void> {
		const { roundId, userIds } = args

		await this.prisma.$transaction([
			//TODO: add global notification or delete global refund from tg bot
			...userIds.map((userId) =>
				this.prisma.notification.create({
					data: { userId, roundId, type: NotificationType.REFUNDED },
				}),
			),
			this.prisma.syncedRound.create({ data: { roundId } }),
		])
	}
}
