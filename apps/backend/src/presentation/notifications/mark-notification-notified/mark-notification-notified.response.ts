import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Notification } from '../../../domain/entities/notification'

const markNotificationNotifiedResponseSchema = z.object({
	id: z.string(),
	userTelegramId: z.string(),
	ripId: z.string(),
	type: z.string(),
	createdAt: z.string(),
	isNotified: z.boolean(),
})

export class MarkNotificationNotifiedResponseDto extends createZodDto(
	markNotificationNotifiedResponseSchema,
) {}

export function toMarkNotificationNotifiedResponseDto(
	notification: Notification,
): MarkNotificationNotifiedResponseDto {
	return {
		id: notification.id.toString(),
		userTelegramId: notification.userTelegramId.toString(),
		ripId: notification.ripId.toString(),
		type: notification.type,
		createdAt: notification.createdAt.toISOString(),
		isNotified: notification.isNotified,
	}
}
