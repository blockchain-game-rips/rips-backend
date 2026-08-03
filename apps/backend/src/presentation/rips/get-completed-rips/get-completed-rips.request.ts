import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

const getCompletedRipsQuerySchema = z.object({
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(MAX_LIMIT)
		.optional()
		.default(DEFAULT_LIMIT),
	cursor: z.coerce.number().int().min(1).optional(),
})

export class GetCompletedRipsQueryDto extends createZodDto(
	getCompletedRipsQuerySchema,
) {}
