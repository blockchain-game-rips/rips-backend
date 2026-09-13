import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { EligibilityPolicy } from '../../../domain/entities/eligibility'

/**
 * `termsFile` is deliberately absent: the policy is read on every gated action,
 * and shipping a few hundred KB of PDF with each read would make the hot path
 * pay for a document that is only fetched when the user asks to see it.
 */
const eligibilityPolicySchema = z
	.object({
		blockedCountries: z.array(z.string()),
		termsVersion: z.number().int(),
		updatedAt: z.string(),
	})
	.meta({ id: 'EligibilityPolicyDto' })

export class EligibilityPolicyDto extends createZodDto(
	eligibilityPolicySchema,
) {}

export function toEligibilityPolicyDto(
	policy: EligibilityPolicy,
): EligibilityPolicyDto {
	return {
		blockedCountries: policy.blockedCountries,
		termsVersion: policy.termsVersion,
		updatedAt: policy.updatedAt.toISOString(),
	}
}
