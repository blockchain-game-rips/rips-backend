import { withAnvilTraces } from '../../utils/cassette/with-traces'

const TRACES = 'eth_call reverted: insufficient allowance'

describe('anvil traces', () => {
	it('returns the value through when nothing failed', async () => {
		const logged = captureLogs()

		await expect(
			withAnvilTraces(
				() => TRACES,
				() => Promise.resolve('ok'),
			),
		).resolves.toBe('ok')

		expect(logged.lines).toEqual([])
	})

	// A revert reason lives nowhere but anvil's own log.
	it('prints the log when the call failed', async () => {
		const logged = captureLogs()
		const failure = new Error('swap reverted')

		await expect(
			withAnvilTraces(
				() => TRACES,
				() => Promise.reject(failure),
			),
		).rejects.toThrow(failure)

		expect(logged.lines).toContain(TRACES)
	})
})

function captureLogs(): { lines: string[] } {
	const lines: string[] = []

	vi.spyOn(console, 'log').mockImplementation((line: string) => {
		lines.push(line)
	})

	return { lines }
}
