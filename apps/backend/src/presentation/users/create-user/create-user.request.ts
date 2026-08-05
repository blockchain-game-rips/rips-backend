import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { toTelegramId } from '../../../domain/value-objects/telegram-id'
import { evmAddressSchema } from '../../shared/evm-address.schema'

const createUserBodySchema = z.object({
	telegramId: z.string().transform((v) => toTelegramId(BigInt(v))),
	referrerAddress: evmAddressSchema.optional(),
})

export class CreateUserBodyDto extends createZodDto(createUserBodySchema) {}
