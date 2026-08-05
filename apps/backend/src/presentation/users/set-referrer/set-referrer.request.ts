import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { evmAddressSchema } from '../../shared/evm-address.schema'

const setReferrerBodySchema = z.object({
	referrerAddress: evmAddressSchema.nullable(),
})

export class SetReferrerBodyDto extends createZodDto(setReferrerBodySchema) {}
