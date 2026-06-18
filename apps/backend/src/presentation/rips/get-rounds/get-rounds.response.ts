import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { roundSchema } from '../shared/round.dto'

const getRoundsResponseSchema = z.object({
	rounds: z.array(roundSchema),
})

export class GetRoundsResponseDto extends createZodDto(
	getRoundsResponseSchema,
) {}
