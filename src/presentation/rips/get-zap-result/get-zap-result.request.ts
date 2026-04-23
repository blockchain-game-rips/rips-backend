import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const getZapResultQuerySchema = z.object({
	zapId: z.string().min(1),
})

export class GetZapResultQueryDto extends createZodDto(
	getZapResultQuerySchema,
) {}
