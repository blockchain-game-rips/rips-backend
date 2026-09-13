import { createCustomError } from '../../utils/common'

export type CountryCode = string & { readonly _brand: 'CountryCode' }

export const CountryCodeError = createCustomError('CountryCodeError')

const ALPHA_2_PATTERN = /^[A-Za-z]{2}$/

/**
 * `Intl.DisplayNames` is the ISO 3166-1 alpha-2 oracle rather than a list
 * checked into this repo: a hardcoded list silently rots as codes are assigned,
 * while the runtime's CLDR data ships with Node.
 *
 * CLDR is wider than ISO, so two classes of code it resolves are still refused:
 * aliases and groupings (`UK`, `EU`) that ISO does not assign as countries, and
 * the `ZZ` unknown-region placeholder. Cloudflare's `XX` and `T1` sentinels fail
 * the same way — the gate stores them verbatim as an observation, but they name
 * an absence rather than a jurisdiction, so an admin cannot block them.
 */
const UNASSIGNED_BY_ISO = new Set(['UK', 'EU', 'ZZ'])

const regionNames = new Intl.DisplayNames(['en'], {
	type: 'region',
	fallback: 'none',
})

export function isCountryCode(value: string): boolean {
	if (!ALPHA_2_PATTERN.test(value)) return false

	const normalized = value.toUpperCase()

	if (UNASSIGNED_BY_ISO.has(normalized)) return false

	return regionNames.of(normalized) !== undefined
}

export function toCountryCode(value: string): CountryCode {
	if (!isCountryCode(value)) {
		throw new CountryCodeError(
			`Not a valid ISO 3166-1 alpha-2 country code: ${value}`,
		)
	}

	return value.toUpperCase() as CountryCode
}
