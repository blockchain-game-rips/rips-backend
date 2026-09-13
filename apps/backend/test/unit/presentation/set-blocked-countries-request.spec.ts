import { SetBlockedCountriesBodyDto } from '../../../src/presentation/eligibility/set-blocked-countries/set-blocked-countries.request'

const parse = (input: unknown) => SetBlockedCountriesBodyDto.schema.parse(input)

describe('SetBlockedCountriesBodyDto', () => {
	it('should accept a list of valid codes and normalize case', () => {
		const result = parse({ blockedCountries: ['ru', 'KP'] })

		expect(result.blockedCountries).toEqual(['RU', 'KP'])
	})

	it('should accept an empty list, meaning nobody is blocked', () => {
		expect(parse({ blockedCountries: [] }).blockedCountries).toEqual([])
	})

	it('should reject an invalid code with a message naming the offender', () => {
		expect(() => parse({ blockedCountries: ['RU', 'QQ'] })).toThrow(/QQ/)
	})

	it('should reject a non-array body', () => {
		expect(() => parse({ blockedCountries: 'RU' })).toThrow()
	})
})
