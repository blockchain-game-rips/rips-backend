import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const setDefaultReferralFeeBodySchema = z.object({
	feeBps: z.number().int().min(0).max(10000),
})

export class SetDefaultReferralFeeBodyDto extends createZodDto(
	setDefaultReferralFeeBodySchema,
) {}
