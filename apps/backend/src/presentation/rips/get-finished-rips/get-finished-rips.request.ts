import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { evmAddressSchema } from '../../shared/evm-address.schema'

const DEFAULT_LIMIT = 20

export const MAX_LIMIT = 100

const getFinishedRipsQuerySchema = z.object({
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(MAX_LIMIT)
		.optional()
		.default(DEFAULT_LIMIT),
	cursor: z.string().optional(),
	userAddress: evmAddressSchema.optional(),
})

export class GetFinishedRipsQueryDto extends createZodDto(
	getFinishedRipsQuerySchema,
) {}
