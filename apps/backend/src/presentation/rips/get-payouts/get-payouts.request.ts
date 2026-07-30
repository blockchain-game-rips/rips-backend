import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const getPayoutsQuerySchema = z.object({
	ripId: z.coerce
		.number()
		.int()
		.min(1)
		.optional()
		.describe('Only return payouts for this rip.'),
	revealed: z
		.enum(['true', 'false'])
		.transform((value) => value === 'true')
		.optional()
		.describe('Only return payouts with this reveal state.'),
})

export class GetPayoutsQueryDto extends createZodDto(getPayoutsQuerySchema) {}
