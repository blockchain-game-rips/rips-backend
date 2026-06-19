import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const getRipsQuerySchema = z.object({
	ids: z.preprocess(
		(v) => (Array.isArray(v) ? v : [v]),
		z.array(z.coerce.number().int().min(1)),
	),
})

export class GetRipsQueryDto extends createZodDto(getRipsQuerySchema) {}
