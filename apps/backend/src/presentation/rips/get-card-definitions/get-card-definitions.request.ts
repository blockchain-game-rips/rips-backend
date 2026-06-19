import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const getCardDefinitionsQuerySchema = z.object({
	presetId: z.coerce.number().int().min(1),
})

export class GetCardDefinitionsQueryDto extends createZodDto(
	getCardDefinitionsQuerySchema,
) {}
