import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const getCompletedRipsQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).optional().default(20),
	cursor: z.coerce.number().int().min(1).optional(),
})

export class GetCompletedRipsQueryDto extends createZodDto(
	getCompletedRipsQuerySchema,
) {}
