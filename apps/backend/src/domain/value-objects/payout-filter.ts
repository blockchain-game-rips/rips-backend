/**
 * Narrows a user's entry payouts. An omitted field applies no constraint.
 */
export type PayoutFilter = {
	ripId?: number
	revealed?: boolean
}
