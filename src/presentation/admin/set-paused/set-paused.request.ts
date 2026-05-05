import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const setPausedBodySchema = z.object({
	isPaused: z.boolean(),
})

export class SetPausedBodyDto extends createZodDto(setPausedBodySchema) {}
