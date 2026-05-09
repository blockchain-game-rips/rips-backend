import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const getSwapResultQuerySchema = z.object({
	zapId: z.string().min(1),
})

export class GetSwapResultQueryDto extends createZodDto(
	getSwapResultQuerySchema,
) {}
