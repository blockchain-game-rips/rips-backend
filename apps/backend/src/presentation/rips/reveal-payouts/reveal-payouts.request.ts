import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const revealPayoutsBodySchema = z.object({
	revealAll: z.boolean(),
})

export class RevealPayoutsBodyDto extends createZodDto(
	revealPayoutsBodySchema,
) {}
