import { EvmAddress } from './evm-address'

export type AddressesActions = {
	purchases: PurchaseAction[]
	claims: ClaimAction[]
	refunds: RefundAction[]
}

export type RefundAction = {
	userAddress: EvmAddress
	amount: bigint
}

export type ClaimAction = {
	userAddress: EvmAddress
	amount: bigint
}

export type PurchaseAction = {
	userAddress: EvmAddress
	entryCount: bigint
	startEntryIndex: bigint
}
