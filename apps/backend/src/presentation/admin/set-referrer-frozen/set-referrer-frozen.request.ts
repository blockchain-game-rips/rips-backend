import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { evmAddressSchema } from '../../shared/evm-address.schema'

const setReferrerFrozenParamsSchema = z.object({
	address: evmAddressSchema,
})

const setReferrerFrozenBodySchema = z.object({
	frozen: z.boolean(),
})

export class SetReferrerFrozenParamsDto extends createZodDto(
	setReferrerFrozenParamsSchema,
) {}

export class SetReferrerFrozenBodyDto extends createZodDto(
	setReferrerFrozenBodySchema,
) {}
