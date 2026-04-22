import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const revealPrizesBodySchema = z.object({
	revealAll: z.boolean(),
})

export class RevealPrizesBodyDto extends createZodDto(revealPrizesBodySchema) {}
