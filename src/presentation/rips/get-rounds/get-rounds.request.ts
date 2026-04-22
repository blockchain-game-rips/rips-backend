import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const getRoundsQuerySchema = z.object({
	ids: z.array(z.coerce.number().int().min(1)),
})

export class GetRoundsQueryDto extends createZodDto(getRoundsQuerySchema) {}
