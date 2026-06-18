import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { roundSchema } from '../shared/round.dto'

const getOngoingRoundsResponseSchema = z.object({
	rounds: z.array(roundSchema),
})

export class GetOngoingRoundsResponseDto extends createZodDto(
	getOngoingRoundsResponseSchema,
) {}
