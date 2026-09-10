import { Rip, RipStatus } from 'src/model'
import { applyStatus, startRefund } from 'src/rip-status'
import { Mock, vi } from 'vitest'

function makeRip(status: RipStatus): Rip {
	return new Rip({ id: '1', status })
}

function makeFillingRip(entriesSold: bigint): Rip {
	return new Rip({ id: '1', status: RipStatus.FILLING, entriesSold })
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

describe('startRefund', () => {
	it('sends a rip with entries sold to REFUNDING', () => {
		const rip = makeFillingRip(3n)
		const { ctx, error } = makeCtx()

		expect(startRefund(rip, ctx)).toBe(true)
		expect(rip.status).toBe(RipStatus.REFUNDING)
		expect(error).not.toHaveBeenCalled()
	})

	// An empty rip has nothing to refund, so no RefundIssued will ever arrive to
	// advance it out of REFUNDING.
	it('sends an empty rip straight to REFUNDED', () => {
		const rip = makeFillingRip(0n)
		const { ctx, error } = makeCtx()

		expect(startRefund(rip, ctx)).toBe(true)
		expect(rip.status).toBe(RipStatus.REFUNDED)
		expect(error).not.toHaveBeenCalled()
	})

	it('is a silent no-op for a rip already refunding', () => {
		const rip = new Rip({
			id: '1',
			status: RipStatus.REFUNDING,
			entriesSold: 3n,
		})
		const { ctx, error } = makeCtx()

		expect(startRefund(rip, ctx)).toBe(false)
		expect(rip.status).toBe(RipStatus.REFUNDING)
		expect(error).not.toHaveBeenCalled()
	})

	it('rejects a rip past the refund branch', () => {
		const rip = new Rip({
			id: '1',
			status: RipStatus.CLAIMED,
			entriesSold: 3n,
		})
		const { ctx, error } = makeCtx()

		expect(startRefund(rip, ctx)).toBe(false)
		expect(rip.status).toBe(RipStatus.CLAIMED)
		expect(error).toHaveBeenCalledOnce()
	})
})
