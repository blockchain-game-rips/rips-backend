import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const ADMIN_API_KEY_HEADER = 'x-admin-api-key'

const adminApiKeyHeaderSchema = z.object({
	[ADMIN_API_KEY_HEADER]: z.string().min(1),
})

export class AdminApiKeyHeaderDto extends createZodDto(
	adminApiKeyHeaderSchema,
) {}
