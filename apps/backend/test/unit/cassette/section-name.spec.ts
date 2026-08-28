import { sectionNameFrom } from '../../utils/cassette/section-name'

const SPEC_PATH = 'test/integration/li-fi/li-fi.spec.ts'

describe('section name', () => {
	it('names the describe blocks a test is nested in', () => {
		expect(
			sectionNameFrom(`${SPEC_PATH} > enterSamechain > with USDC`),
		).toBe('enterSamechain > with USDC')
	})

	// The tape file is already named after the spec, so repeating it in every
	// key inside that file says nothing.
	it('drops the spec path the blocks sit under', () => {
		expect(sectionNameFrom(`${SPEC_PATH} > enterSamechain`)).toBe(
			'enterSamechain',
		)
	})

	it('refuses a suite that is not inside a spec file', () => {
		expect(() => sectionNameFrom('enterSamechain')).toThrow(
			'useVcr() must be called inside a describe block',
		)
	})
})
