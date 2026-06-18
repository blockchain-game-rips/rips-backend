import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { toTelegramId } from '../../../domain/value-objects/telegram-id'

export const TELEGRAM_ID_PARAM = 'telegramId'

const getUserParamsSchema = z.object({
	[TELEGRAM_ID_PARAM]: z
		.string()
		.regex(/^\d+$/)
		.transform((v) => toTelegramId(BigInt(v))),
})

export class GetUserParamsDto extends createZodDto(getUserParamsSchema) {}
