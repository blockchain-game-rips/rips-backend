import { Rip, RipStatus } from './model'

// A rip advances through one of two terminal branches: it either seals and pays
// out, or it expires and refunds. Transitions are one-way, so a late expiry pass
// or a replayed log can never roll a rip back to an earlier state.
const ALLOWED_TRANSITIONS: Record<RipStatus, readonly RipStatus[]> = {
	[RipStatus.FILLING]: [
		RipStatus.SEALED,
		RipStatus.REFUNDING,
		RipStatus.REFUNDED,
	],
	[RipStatus.SEALED]: [RipStatus.VRF_REQUESTED],
	[RipStatus.VRF_REQUESTED]: [RipStatus.CLAIMING],
	[RipStatus.CLAIMING]: [RipStatus.CLAIMED],
	[RipStatus.CLAIMED]: [],
	[RipStatus.REFUNDING]: [RipStatus.REFUNDED],
	[RipStatus.REFUNDED]: [],
}

// Narrowed to the one method applyStatus uses: the squid Context satisfies it
// structurally, and tests need no full Logger stub.
interface ErrorLogger {
	log: { error: (message: string) => void }
}

/**
 * Returns whether the status changed, so callers can skip writing the other
 * fields that belong to a rejected transition. Re-applying the current status is
 * a silent no-op; anything else is logged as an error and left unapplied rather
 * than thrown, because a thrown error would make the batch retry the same
 * deterministic failure forever.
 */
export function applyStatus(
	rip: Rip,
	next: RipStatus,
	ctx: ErrorLogger,
): boolean {
	if (rip.status === next) return false

	if (!ALLOWED_TRANSITIONS[rip.status].includes(next)) {
		ctx.log.error(
			`Rip ${rip.id}: rejected illegal status transition ${rip.status} -> ${next}`,
		)

		return false
	}

	rip.status = next

	return true
}

/**
 * Opens the refund branch for a rip, whether it expired on its own deadline or an
 * admin cancelled it early. A rip that sold no entries skips REFUNDING: nothing
 * can be refunded, so no RefundIssued would ever arrive to advance it, and it
 * would otherwise sit in REFUNDING forever.
 */
export function startRefund(rip: Rip, ctx: ErrorLogger): boolean {
	const next =
		rip.entriesSold === 0n ? RipStatus.REFUNDED : RipStatus.REFUNDING

	return applyStatus(rip, next, ctx)
}
