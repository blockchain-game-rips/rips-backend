import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'
import { toTelegramId } from '../../../domain/value-objects/telegram-id'

const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

const createUserBodySchema = z.object({
	telegramId: z.string().transform((v) => toTelegramId(BigInt(v))),
	referrerAddress: z
		.string()
		.regex(EVM_ADDRESS_REGEX)
		.transform(toEvmAddress)
		.optional(),
})

export class CreateUserBodyDto extends createZodDto(createUserBodySchema) {}
