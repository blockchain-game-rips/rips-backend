import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { toTelegramId } from '../../../domain/value-objects/telegram-id'

/**
 * `country` is not validated against ISO: it records what the country signal
 * observed, including Cloudflare's `XX` (unknown) and `T1` (Tor) sentinels.
 * Rejecting those would force the caller to invent a country it did not see.
 *
 * `acceptedAt` is not accepted from the caller — the server stamps the moment.
 */
const recordEligibilityBodySchema = z.object({
	telegramId: z.string().transform((v) => toTelegramId(BigInt(v))),
	country: z.string().min(1),
	termsVersion: z.number().int().positive(),
})

export class RecordEligibilityBodyDto extends createZodDto(
	recordEligibilityBodySchema,
) {}
