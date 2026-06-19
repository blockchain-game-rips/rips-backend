import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ripSchema } from '../shared/rip.dto'

const getRipsResponseSchema = z.object({
	rips: z.array(ripSchema),
})

export class GetRipsResponseDto extends createZodDto(getRipsResponseSchema) {}
