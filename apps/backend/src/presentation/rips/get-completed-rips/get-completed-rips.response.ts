import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ripSchema } from '../shared/rip.dto'

const getCompletedRipsResponseSchema = z.object({
	rips: z.array(ripSchema),
	nextCursor: z.number().nullable(),
})

export class GetCompletedRipsResponseDto extends createZodDto(
	getCompletedRipsResponseSchema,
) {}
