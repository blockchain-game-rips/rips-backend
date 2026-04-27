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
		const records = await this.prisma.notification.findMany()

		return records.map(toNotification)
	}

	async setNotified(id: bigint): Promise<Notification> {
		const record = await this.prisma.notification.update({
			where: { id },
			data: { isNotified: true },
		})

		return toNotification(record)
	}
}

type NotificationRecord = {
	id: bigint
	userId: bigint
	roundId: number
	type: string
	createdAt: Date
	isNotified: boolean
}

function toNotification(record: NotificationRecord): Notification {
	return {
		id: record.id,
		userId: record.userId,
		roundId: BigInt(record.roundId),
		type: NotificationType[record.type as keyof typeof NotificationType],
		createdAt: record.createdAt,
		isNotified: record.isNotified,
	}
}
