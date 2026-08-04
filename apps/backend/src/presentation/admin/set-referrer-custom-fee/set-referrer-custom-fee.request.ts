import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { evmAddressSchema } from '../../shared/evm-address.schema'

const setReferrerCustomFeeParamsSchema = z.object({
	address: evmAddressSchema,
})

const setReferrerCustomFeeBodySchema = z.object({
	feeBps: z.number().int().min(0).max(10000),
})

export class SetReferrerCustomFeeParamsDto extends createZodDto(
	setReferrerCustomFeeParamsSchema,
) {}

export class SetReferrerCustomFeeBodyDto extends createZodDto(
	setReferrerCustomFeeBodySchema,
) {}
