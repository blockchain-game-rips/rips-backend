import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { UserEligibility } from '../../../domain/entities/eligibility'

const userEligibilitySchema = z
	.object({
		country: z.string(),
		termsVersion: z.number().int(),
		acceptedAt: z.string(),
	})
	.meta({ id: 'UserEligibilityDto' })

export class UserEligibilityDto extends createZodDto(userEligibilitySchema) {}

export function toUserEligibilityDto(
	eligibility: UserEligibility,
): UserEligibilityDto {
	return {
		country: eligibility.country,
		termsVersion: eligibility.termsVersion,
		acceptedAt: eligibility.acceptedAt.toISOString(),
	}
}
