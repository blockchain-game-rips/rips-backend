import { useAcceleratedTime } from '../../utils/cassette/accelerated-time'

const DELAY_MS = 2_000
const SPEEDUP = 20

// The scaled delay, with room for the event loop to get around to it.
const TOLERANCE_MS = 150
const EXPECTED_MS = DELAY_MS / SPEEDUP

const LATE_MS = 5_000
const EARLY_MS = 40

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('accelerated time', () => {
	const originalSetTimeout = globalThis.setTimeout

	describe('while active', () => {
		useAcceleratedTime()

		it('returns from a sleep in a tenth of the time', async () => {
			const start = Date.now()

			await sleep(DELAY_MS)

			const elapsed = Date.now() - start

			expect(elapsed).toBeGreaterThanOrEqual(EXPECTED_MS - TOLERANCE_MS)
			expect(elapsed).toBeLessThan(EXPECTED_MS + TOLERANCE_MS)
		})

		// A deadline that overtakes the response it races aborts a live request.
		it('keeps a longer delay behind a shorter one', async () => {
			const fired: string[] = []

			await new Promise<void>((resolve) => {
				setTimeout(() => fired.push('late'), LATE_MS)
				setTimeout(() => {
					fired.push('early')
					resolve()
				}, EARLY_MS)
			})

			expect(fired).toEqual(['early'])
		})
	})

	describe('after the spec that used it', () => {
		it('leaves the global timer as it found it', () => {
			expect(globalThis.setTimeout).toBe(originalSetTimeout)
		})
	})
})
