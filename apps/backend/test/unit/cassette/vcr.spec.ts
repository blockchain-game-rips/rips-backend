import { Tape } from '../../utils/cassette/tape'
import { vcrMode } from '../../utils/cassette/vcr'

const RECORD = 'record'

describe('vcr mode', () => {
	it('records only when asked to, and replays otherwise', () => {
		expect(vcrMode(RECORD)).toBe('record')
		expect(vcrMode(undefined)).toBe('replay')
		expect(vcrMode('')).toBe('replay')
		expect(vcrMode('anything else')).toBe('replay')
	})
})

describe('tape resolution', () => {
	it('hands back what a recording tape produced, under its own key', async () => {
		const tape = stubTape()

		const resolved = { anvil: tape.recorded() }
		await tape.record()

		expect(resolved.anvil).toEqual({ rpcUrl: 'http://live' })
	})

	it('hands back a stand-in on replay, without bringing anything up', () => {
		const tape = stubTape()

		expect(tape.replayed()).toEqual({ rpcUrl: 'http://replayed' })
		expect(tape.started).toBe(false)
	})
})

type StubTape = Tape<{ rpcUrl: string }, { rpcUrl: string }> & {
	started: boolean
}

function stubTape(): StubTape {
	const tape: StubTape = {
		started: false,

		normalize: (definition) => definition,
		owns: () => true,

		recorded: () => ({ rpcUrl: 'http://live' }),
		record: () => {
			tape.started = true

			return Promise.resolve()
		},
		stop: async () => {},

		replayed: () => ({ rpcUrl: 'http://replayed' }),
	}

	return tape
}
