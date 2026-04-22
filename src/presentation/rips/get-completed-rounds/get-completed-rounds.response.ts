import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { roundSchema } from '../shared/round.dto'

const getCompletedRoundsResponseSchema = z.object({
	rounds: z.array(roundSchema),
	nextCursor: z.number().nullable(),
})

export class GetCompletedRoundsResponseDto extends createZodDto(
	getCompletedRoundsResponseSchema,
) {}
