import { Injectable } from '@nestjs/common'
import { NotificationRepository } from '../../application/interfaces/repositories/notification.repository'
import {
	Notification,
	NotificationType,
} from '../../domain/entities/notification'
import { PrismaService } from './prisma.service'

@Injectable()
export class PrismaNotificationRepository extends NotificationRepository {
	constructor(private readonly prisma: PrismaService) {
		super()
	}

	async findAll(): Promise<Notification[]> {
		const records = await this.prisma.notification.findMany({
			where: { isNotified: false },
		})

		return Promise.all(records.map((r) => this.resolveNotification(r)))
	}

	async setNotified(id: bigint): Promise<Notification> {
		const record = await this.prisma.notification.update({
			where: { id },
			data: { isNotified: true },
		})

		return this.resolveNotification(record)
	}

	private async resolveNotification(
		record: NotificationRecord,
	): Promise<Notification> {
		let userTelegramId: bigint

		if (record.userId === GROUP_BROADCAST_USER_ID) {
			userTelegramId = GROUP_BROADCAST_USER_ID
		} else {
			const user = await this.prisma.user.findUniqueOrThrow({
				where: { id: record.userId },
				select: { telegramId: true },
			})
			userTelegramId = user.telegramId
		}

		return {
			id: record.id,
			userTelegramId,
			roundId: BigInt(record.roundId),
			type: NotificationType[
				record.type as keyof typeof NotificationType
			],
			createdAt: record.createdAt,
			isNotified: record.isNotified,
		}
	}
}

const GROUP_BROADCAST_USER_ID = BigInt(0)

type NotificationRecord = {
	id: bigint
	userId: bigint
	roundId: number
	type: string
	createdAt: Date
	isNotified: boolean
}
