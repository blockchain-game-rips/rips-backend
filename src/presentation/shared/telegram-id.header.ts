import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { toTelegramId } from '../../domain/value-objects/telegram-id'

export const TELEGRAM_ID_HEADER = 'x-telegram-id'

const telegramIdHeaderSchema = z.object({
	[TELEGRAM_ID_HEADER]: z
		.string()
		.regex(/^\d+$/)
		.transform((v) => toTelegramId(BigInt(v))),
})

export class TelegramIdHeaderDto extends createZodDto(telegramIdHeaderSchema) {}
