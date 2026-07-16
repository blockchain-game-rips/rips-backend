import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'
import { toPrivateKey } from '../../../domain/value-objects/private-key'
import { toTelegramId } from '../../../domain/value-objects/telegram-id'

const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

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
	referrerAddress: z
		.string()
		.regex(EVM_ADDRESS_REGEX)
		.transform(toEvmAddress)
		.optional(),
})

export class ImportUserBodyDto extends createZodDto(importUserBodySchema) {}
