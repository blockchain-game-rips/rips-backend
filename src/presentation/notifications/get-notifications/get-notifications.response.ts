import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Notification } from '../../../domain/entities/notification'

const notificationSchema = z.object({
	id: z.string(),
	userTelegramId: z.string(),
	roundId: z.string(),
	type: z.string(),
	createdAt: z.string(),
	isNotified: z.boolean(),
})

const getNotificationsResponseSchema = z.object({
	notifications: z.array(notificationSchema),
})

export class GetNotificationsResponseDto extends createZodDto(
	getNotificationsResponseSchema,
) {}

export function toGetNotificationsResponseDto(
	notifications: Notification[],
): GetNotificationsResponseDto {
	return {
		notifications: notifications.map((n) => ({
			id: n.id.toString(),
			userTelegramId: n.userTelegramId.toString(),
			roundId: n.roundId.toString(),
			type: n.type,
			createdAt: n.createdAt.toISOString(),
			isNotified: n.isNotified,
		})),
	}
}
