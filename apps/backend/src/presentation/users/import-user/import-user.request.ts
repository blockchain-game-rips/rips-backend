import { createZodDto } from 'nestjs-zod'
import { isHex } from 'viem'
import { z } from 'zod'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'
import { toTelegramId } from '../../../domain/value-objects/telegram-id'

const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/
const PRIVATE_KEY_REGEX = /^0x[0-9a-fA-F]{64}$/

const importUserBodySchema = z.object({
	telegramId: z.string().transform((v) => toTelegramId(BigInt(v))),
	privateKey: z
		.string()
		.regex(PRIVATE_KEY_REGEX)
		.transform((v, ctx) => {
			if (!isHex(v)) {
				ctx.addIssue({ code: 'custom', message: 'Invalid hex' })

				return z.NEVER
			}

			return v
		}),
	referrerAddress: z
		.string()
		.regex(EVM_ADDRESS_REGEX)
		.transform(toEvmAddress)
		.optional(),
})

export class ImportUserBodyDto extends createZodDto(importUserBodySchema) {}
