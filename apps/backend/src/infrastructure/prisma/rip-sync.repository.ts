import { Injectable } from '@nestjs/common'
import { NotificationType } from '../../../generated/prisma'
import { RipSyncRepository } from '../../application/interfaces/repositories/rip-sync.repository'
import { EntryPayout } from '../../domain/value-objects/entry-payout'
import { PrismaService } from './prisma.service'

const GROUP_USER_ID = 0n

@Injectable()
export class PrismaRipSyncRepository extends RipSyncRepository {
	constructor(private readonly prisma: PrismaService) {
		super()
	}

	async getHighestSyncedRipId(): Promise<number | null> {
		const result = await this.prisma.syncedRip.findFirst({
			orderBy: { ripId: 'desc' },
			select: { ripId: true },
		})

		return result?.ripId ?? null
	}

	async syncClaimedRip(args: {
		ripId: number
		payouts: EntryPayout[]
	}): Promise<void> {
		const { ripId, payouts } = args

		const uniqueUserAddresses = [
			...new Set(payouts.map((payout) => payout.userAddress)),
		]

		await this.prisma.$transaction(async (tx) => {
			const wallets = await tx.evmWallet.findMany({
				where: { address: { in: uniqueUserAddresses } },
				select: { userId: true },
			})

			await Promise.all([
				...payouts.map((payout) =>
					tx.entryPayout.create({
						data: {
							userAddress: payout.userAddress,
							ripId: payout.ripId,
							entryNumber: payout.entryNumber,
							payoutAmount: payout.payoutAmount,
							cardDefinitionId: BigInt(payout.card.id),
						},
					}),
				),
				...wallets.map((wallet) =>
					tx.notification.create({
						data: {
							userId: wallet.userId,
							ripId,
							type: NotificationType.CLAIMED,
						},
					}),
				),
				tx.notification.create({
					data: {
						userId: GROUP_USER_ID,
						ripId,
						type: NotificationType.CLAIMED,
					},
				}),
				tx.syncedRip.create({ data: { ripId } }),
			])
		})
	}

	async syncRefundedRip(args: {
		ripId: number
		userIds: bigint[]
	}): Promise<void> {
		const { ripId, userIds } = args

		await this.prisma.$transaction([
			//TODO: add global notification or delete global refund from tg bot
			...userIds.map((userId) =>
				this.prisma.notification.create({
					data: { userId, ripId, type: NotificationType.REFUNDED },
				}),
			),
			this.prisma.syncedRip.create({ data: { ripId } }),
		])
	}
}
