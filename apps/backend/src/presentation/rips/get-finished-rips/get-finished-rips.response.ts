import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ripSchema } from '../shared/rip.dto'

const getFinishedRipsResponseSchema = z.object({
	rips: z.array(ripSchema),
	nextCursor: z.string().nullable(),
})

export class GetFinishedRipsResponseDto extends createZodDto(
	getFinishedRipsResponseSchema,
) {}
