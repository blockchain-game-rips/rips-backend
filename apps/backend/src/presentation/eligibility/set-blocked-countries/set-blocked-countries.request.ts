import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import {
	isCountryCode,
	toCountryCode,
} from '../../../domain/value-objects/country-code'

/**
 * Validation happens per element so the message can name the offending code
 * rather than reporting that "the list" is invalid — the admin needs to know
 * which entry to fix.
 *
 * An empty list is valid and means nobody is blocked.
 */
const blockedCountrySchema = z
	.string()
	.superRefine((value, ctx) => {
		if (isCountryCode(value)) return

		ctx.addIssue({
			code: 'custom',
			message: `Not a valid ISO 3166-1 alpha-2 country code: ${value}`,
		})
	})
	.transform(toCountryCode)

const setBlockedCountriesBodySchema = z.object({
	blockedCountries: z.array(blockedCountrySchema),
})

export class SetBlockedCountriesBodyDto extends createZodDto(
	setBlockedCountriesBodySchema,
) {}
