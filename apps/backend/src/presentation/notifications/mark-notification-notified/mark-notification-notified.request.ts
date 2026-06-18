import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const NOTIFICATION_ID_PARAM = 'notificationId'

const markNotificationNotifiedParamsSchema = z.object({
	[NOTIFICATION_ID_PARAM]: z
		.string()
		.regex(/^\d+$/)
		.transform((v) => BigInt(v)),
})

export class MarkNotificationNotifiedParamsDto extends createZodDto(
	markNotificationNotifiedParamsSchema,
) {}
