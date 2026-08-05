import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { toPrivateKey } from '../../../domain/value-objects/private-key'
import { toTelegramId } from '../../../domain/value-objects/telegram-id'
import { evmAddressSchema } from '../../shared/evm-address.schema'

const importUserBodySchema = z.object({
	telegramId: z.string().transform((v) => toTelegramId(BigInt(v))),
	privateKey: z.string().transform((v, ctx) => {
		try {
			return toPrivateKey(v)
		} catch {
			ctx.addIssue({ code: 'custom', message: 'Invalid private key' })

			return z.NEVER
		}
	}),
	referrerAddress: evmAddressSchema.optional(),
})

export class ImportUserBodyDto extends createZodDto(importUserBodySchema) {}
