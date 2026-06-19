import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const getCardCollectionQuerySchema = z.object({
	presetId: z.coerce.number().int().min(1),
})

export class GetCardCollectionQueryDto extends createZodDto(
	getCardCollectionQuerySchema,
) {}
