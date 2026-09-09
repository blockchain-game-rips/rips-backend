import { AddressesActions } from '../value-objects/actions'
import { EvmAddress } from '../value-objects/evm-address'

/**
 * A refund pays a buyer's whole stake in one transaction and the contract
 * rejects a second attempt, so an address is done as soon as it appears once
 * among the refunds, however many separate purchases it made.
 */
export function resolveUnrefundedAddresses(
	actions: AddressesActions,
): EvmAddress[] {
	const refunded = new Set(actions.refunds.map((r) => r.userAddress))

	const buyers = new Set(actions.purchases.map((p) => p.userAddress))

	return [...buyers].filter((address) => !refunded.has(address))
}
