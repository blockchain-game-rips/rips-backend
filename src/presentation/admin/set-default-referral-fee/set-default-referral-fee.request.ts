import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const setDefaultReferralFeeBodySchema = z.object({
	feePercent: z.number().int().min(0).max(10000),
})

export class SetDefaultReferralFeeBodyDto extends createZodDto(
	setDefaultReferralFeeBodySchema,
) {}
