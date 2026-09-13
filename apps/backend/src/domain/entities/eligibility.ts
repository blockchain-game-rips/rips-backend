import { CountryCode } from '../value-objects/country-code'

/**
 * What a user last accepted. Absence of this record means the user has never
 * been gated, which is a distinct answer from any stored value.
 *
 * `country` is whatever was observed at acceptance time, stored verbatim —
 * including Cloudflare's `XX` and `T1` sentinels — so it is a plain string
 * rather than a validated `CountryCode`.
 */
export type UserEligibility = {
	country: string
	termsVersion: number
	acceptedAt: Date
}

export type EligibilityPolicy = {
	blockedCountries: CountryCode[]
	termsVersion: number
	updatedAt: Date
}
