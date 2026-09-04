/**
 * Where a rip sits in settlement order: the position of its
 * `RandomnessFulfilled` event. Immutable and monotonic, so a rip fulfilled
 * later always sorts later no matter when the backend got around to it.
 *
 * A `RandomnessFulfillment` satisfies this, which is how a rip's own position
 * reaches the repositories without dragging the VRF pair along.
 */
export type SettlementKey = {
	blockNumber: bigint
	logIndex: number
}
