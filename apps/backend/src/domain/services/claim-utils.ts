import { AddressesActions } from '../value-objects/actions'
import { EvmAddress } from '../value-objects/evm-address'

function sumEntriesByAddress(
	entries: { userAddress: EvmAddress; entryCount: number }[],
): Map<EvmAddress, number> {
	const totals = new Map<EvmAddress, number>()

	for (const entry of entries) {
		const total = totals.get(entry.userAddress) ?? 0

		totals.set(entry.userAddress, total + entry.entryCount)
	}

	return totals
}

/**
 * A claim pays out a bounded number of entry chunks per transaction, so one
 * buyer can need several. An address is done only once its claims cover every
 * entry it bought; the payout amount says nothing, because a losing entry
 * claims fine and pays zero.
 */
export function resolveUnclaimedAddresses(
	actions: AddressesActions,
): EvmAddress[] {
	const purchased = sumEntriesByAddress(actions.purchases)
	const claimed = sumEntriesByAddress(actions.claims)

	return [...purchased]
		.filter(
			([address, entryCount]) => (claimed.get(address) ?? 0) < entryCount,
		)
		.map(([address]) => address)
}
