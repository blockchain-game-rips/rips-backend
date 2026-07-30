import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const getPayoutsQuerySchema = z.object({
	ripId: z.coerce.number().int().min(1).optional(),
	revealed: z
		.enum(['true', 'false'])
		.transform((value) => value === 'true')
		.optional(),
})

export class GetPayoutsQueryDto extends createZodDto(getPayoutsQuerySchema) {}
