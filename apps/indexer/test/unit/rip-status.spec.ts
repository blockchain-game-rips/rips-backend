import { Rip, RipStatus } from 'src/model'
import { applyStatus } from 'src/rip-status'
import { Mock, vi } from 'vitest'

function makeRip(status: RipStatus): Rip {
	return new Rip({ id: '1', status })
}

function makeCtx(): { ctx: { log: { error: Mock } }; error: Mock } {
	const error = vi.fn()

	return { ctx: { log: { error } }, error }
}

const ALLOWED_TRANSITIONS: [RipStatus, RipStatus][] = [
	[RipStatus.FILLING, RipStatus.SEALED],
	[RipStatus.FILLING, RipStatus.REFUNDING],
	[RipStatus.FILLING, RipStatus.REFUNDED],
	[RipStatus.SEALED, RipStatus.VRF_REQUESTED],
	[RipStatus.VRF_REQUESTED, RipStatus.CLAIMING],
	[RipStatus.CLAIMING, RipStatus.CLAIMED],
	[RipStatus.REFUNDING, RipStatus.REFUNDED],
]

const isAllowed = (current: RipStatus, next: RipStatus): boolean =>
	ALLOWED_TRANSITIONS.some(([from, to]) => from === current && to === next)

// Every remaining pair, so a newly added RipStatus is covered without editing
// this file. Self-transitions are excluded: they are a no-op, not a rejection.
const FORBIDDEN_TRANSITIONS: [RipStatus, RipStatus][] = Object.values(RipStatus)
	.flatMap((current) =>
		Object.values(RipStatus).map((next): [RipStatus, RipStatus] => [
			current,
			next,
		]),
	)
	.filter(([current, next]) => current !== next && !isAllowed(current, next))

describe('applyStatus', () => {
	it.each(ALLOWED_TRANSITIONS)('applies %s -> %s', (current, next) => {
		const rip = makeRip(current)
		const { ctx, error } = makeCtx()

		expect(applyStatus(rip, next, ctx)).toBe(true)
		expect(rip.status).toBe(next)
		expect(error).not.toHaveBeenCalled()
	})

	it.each(FORBIDDEN_TRANSITIONS)(
		'rejects %s -> %s without mutating the rip',
		(current, next) => {
			const rip = makeRip(current)
			const { ctx, error } = makeCtx()

			expect(applyStatus(rip, next, ctx)).toBe(false)
			expect(rip.status).toBe(current)
			expect(error).toHaveBeenCalledOnce()
		},
	)

	it.each(Object.values(RipStatus))(
		'treats %s -> %s as a silent no-op',
		(status) => {
			const rip = makeRip(status)
			const { ctx, error } = makeCtx()

			expect(applyStatus(rip, status, ctx)).toBe(false)
			expect(rip.status).toBe(status)
			expect(error).not.toHaveBeenCalled()
		},
	)
})
