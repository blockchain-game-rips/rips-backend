import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const exportKeyResponseSchema = z.object({
	privateKey: z.string(),
})

export class ExportKeyResponseDto extends createZodDto(
	exportKeyResponseSchema,
) {}
