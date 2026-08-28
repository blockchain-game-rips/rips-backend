import nock from 'nock'
import {
	ALCHEMY_KEY_PLACEHOLDER,
	alchemyTape,
} from '../../utils/cassette/alchemy-tape'

const ORIGIN = 'https://base-mainnet.g.alchemy.com'

const LIVE_KEY = 'live-secret-key'

describe('alchemy tape', () => {
	afterEach(() => {
		vi.unstubAllEnvs()
	})

	it('hands a recording run the live key', () => {
		vi.stubEnv('ALCHEMY_API_KEY', LIVE_KEY)

		expect(alchemyTape(ORIGIN).recorded().apiKey).toBe(LIVE_KEY)
	})

	it('refuses to record without a key, rather than taping an empty one', () => {
		vi.stubEnv('ALCHEMY_API_KEY', '')

		expect(() => alchemyTape(ORIGIN).recorded().apiKey).toThrow(
			'ALCHEMY_API_KEY is not set',
		)
	})

	it('hands a replay the placeholder, so it builds the url on the tape', () => {
		expect(alchemyTape(ORIGIN).replayed().apiKey).toBe(
			ALCHEMY_KEY_PLACEHOLDER,
		)
	})

	it('keeps the live key out of what it writes to the tape', () => {
		vi.stubEnv('ALCHEMY_API_KEY', LIVE_KEY)

		const normalized = alchemyTape(ORIGIN).normalize({
			scope: `${ORIGIN}:443`,
			path: `/v2/${LIVE_KEY}`,
			method: 'POST',
		})

		expect(String(normalized.path)).toBe(`/v2/${ALCHEMY_KEY_PLACEHOLDER}`)
	})

	it('scrubs the key wherever in the path it sits', () => {
		vi.stubEnv('ALCHEMY_API_KEY', LIVE_KEY)

		const normalized = alchemyTape(ORIGIN).normalize({
			scope: `${ORIGIN}:443`,
			path: `/data/v1/${LIVE_KEY}/assets/tokens/by-address`,
			method: 'POST',
		})

		expect(String(normalized.path)).toBe(
			`/data/v1/${ALCHEMY_KEY_PLACEHOLDER}/assets/tokens/by-address`,
		)
	})

	it('leaves the path alone when no key is configured', () => {
		vi.stubEnv('ALCHEMY_API_KEY', '')

		const path = '/v2/whatever'

		const normalized = alchemyTape(ORIGIN).normalize({
			scope: `${ORIGIN}:443`,
			path,
			method: 'POST',
		})

		expect(String(normalized.path)).toBe(path)
	})

	// Every tape normalizes every interaction, so one that is not this tape's
	// has to come back untouched.
	it('leaves another api alone', () => {
		vi.stubEnv('ALCHEMY_API_KEY', LIVE_KEY)

		const untouched: nock.Definition = {
			scope: 'https://li.quest:443',
			path: `/v1/quote?key=${LIVE_KEY}`,
			method: 'GET',
		}

		expect(alchemyTape(ORIGIN).normalize(untouched)).toEqual(untouched)
	})

	it('owns its own origin and nothing else', () => {
		const tape = alchemyTape(ORIGIN)

		const definition = (scope: string): nock.Definition => ({
			scope,
			path: '/v2/key',
			method: 'POST',
		})

		expect(tape.owns(definition(`${ORIGIN}:443`))).toBe(true)
		expect(tape.owns(definition('https://li.quest:443'))).toBe(false)
	})
})

// What a replay builds has to be what a recording wrote, or the tape misses.
describe('alchemy tape url agreement', () => {
	it('replays against the path a scrubbed recording left behind', () => {
		vi.stubEnv('ALCHEMY_API_KEY', LIVE_KEY)

		const recording = alchemyTape(ORIGIN)

		const taped = recording.normalize({
			scope: `${ORIGIN}:443`,
			path: `/v2/${recording.recorded().apiKey}`,
			method: 'POST',
		})

		vi.unstubAllEnvs()

		expect(String(taped.path)).toBe(
			`/v2/${alchemyTape(ORIGIN).replayed().apiKey}`,
		)
	})
})
