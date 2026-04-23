import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const getCardCollectionQuerySchema = z.object({
	stakeId: z.coerce.number().int().min(1),
})

export class GetCardCollectionQueryDto extends createZodDto(
	getCardCollectionQuerySchema,
) {}
