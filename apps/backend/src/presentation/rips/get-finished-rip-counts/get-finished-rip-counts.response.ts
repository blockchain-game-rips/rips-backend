import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const getFinishedRipCountsResponseSchema = z.object({
	claimed: z.number().int().nonnegative(),
	refunded: z.number().int().nonnegative(),
})

export class GetFinishedRipCountsResponseDto extends createZodDto(
	getFinishedRipCountsResponseSchema,
) {}
