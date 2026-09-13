import {
	CountryCodeError,
	isCountryCode,
	toCountryCode,
} from '../../../src/domain/value-objects/country-code'

describe('toCountryCode', () => {
	it('should accept an assigned ISO 3166-1 alpha-2 code', () => {
		expect(toCountryCode('US')).toBe('US')
		expect(toCountryCode('RU')).toBe('RU')
		expect(toCountryCode('AQ')).toBe('AQ')
	})

	it('should uppercase a lowercase code', () => {
		expect(toCountryCode('gb')).toBe('GB')
	})

	it('should reject an unassigned code, naming the offender', () => {
		expect(() => toCountryCode('QQ')).toThrow(CountryCodeError)
		expect(() => toCountryCode('QQ')).toThrow(/QQ/)
	})

	it('should reject codes that are not two letters', () => {
		expect(() => toCountryCode('USA')).toThrow(CountryCodeError)
		expect(() => toCountryCode('U')).toThrow(CountryCodeError)
		expect(() => toCountryCode('U1')).toThrow(CountryCodeError)
		expect(() => toCountryCode('')).toThrow(CountryCodeError)
	})

	// CLDR knows these, ISO 3166-1 does not assign them as country codes.
	it('should reject CLDR aliases and groupings that ISO does not assign', () => {
		expect(() => toCountryCode('UK')).toThrow(CountryCodeError)
		expect(() => toCountryCode('EU')).toThrow(CountryCodeError)
	})

	// The gate stores what Cloudflare observed, including these sentinels, but
	// an admin may never block them: they name an absence, not a jurisdiction.
	it('should reject the Cloudflare sentinels XX and T1', () => {
		expect(() => toCountryCode('XX')).toThrow(CountryCodeError)
		expect(() => toCountryCode('T1')).toThrow(CountryCodeError)
	})
})

describe('isCountryCode', () => {
	it('should report validity without throwing', () => {
		expect(isCountryCode('FR')).toBe(true)
		expect(isCountryCode('QQ')).toBe(false)
	})
})
