import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ripSchema } from '../shared/rip.dto'

const getOngoingRipsResponseSchema = z.object({
	rips: z.array(ripSchema),
})

export class GetOngoingRipsResponseDto extends createZodDto(
	getOngoingRipsResponseSchema,
) {}
