import { isRecordedHost } from '../../utils/cassette/hosts'
import { cassettePathFor } from '../../utils/cassette/use-cassette'

describe('cassette naming', () => {
	it('derives the tape path from the spec path', () => {
		expect(
			cassettePathFor('/repo/test/integration/li-fi/li-fi.spec.ts'),
		).toBe('/repo/test/integration/li-fi/__cassettes__/li-fi.spec.json')
	})
})

describe('recorded hosts', () => {
	it('names the external APIs', () => {
		expect(isRecordedHost('li.quest')).toBe(true)
		expect(isRecordedHost('dln.debridge.finance')).toBe(true)
		expect(isRecordedHost('api.geckoterminal.com')).toBe(true)
		expect(isRecordedHost('base-mainnet.g.alchemy.com')).toBe(true)
	})

	it('leaves the test infrastructure alone', () => {
		expect(isRecordedHost('localhost')).toBe(false)
		expect(isRecordedHost('127.0.0.1')).toBe(false)
	})

	it('does not match a host that merely ends in a recorded name', () => {
		expect(isRecordedHost('evil-li.quest')).toBe(false)
		expect(isRecordedHost('notalchemy.com')).toBe(false)
	})
})
