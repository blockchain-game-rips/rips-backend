/**
 * Runs the clock ten times faster for the duration of a spec.
 *
 * A cassette replays the exact exchange that was recorded, including the polls
 * a client made while waiting for something that had not happened yet: anvil
 * answers `eth_getTransactionReceipt` with null until the block is mined, so
 * viem sleeps and asks again. On replay the answer is already on the tape and
 * the sleeping is pure dead time — eleven seconds of it for a single swap.
 *
 * Delays are scaled rather than dropped, because a timer is not always a
 * sleep: viem arms one to abort a request that has taken too long. Collapsing
 * that to zero aborts a live request before nock has walked its socket
 * emulation far enough to answer, which reads as a transport failure and burns
 * the retries the tape has no answers for. Scaling keeps every deadline
 * comfortably behind the response it is racing.
 */
export function useAcceleratedTime(): void {
	let restore: (() => void) | undefined

	beforeAll(() => {
		restore = accelerateTime()
	})

	afterAll(() => {
		restore?.()
		restore = undefined
	})
}

const SPEEDUP = 50

function accelerateTime(): () => void {
	const original = globalThis.setTimeout

	const accelerated: typeof globalThis.setTimeout = Object.assign(
		(
			callback: (...args: unknown[]) => void,
			delay?: number,
			...args: unknown[]
		) => original(callback, (delay ?? 0) / SPEEDUP, ...args),
		original,
	)

	globalThis.setTimeout = accelerated

	return () => {
		globalThis.setTimeout = original
	}
}
