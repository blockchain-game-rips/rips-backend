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
	entryCount: number
	amount: bigint
}

export type PurchaseAction = {
	userAddress: EvmAddress
	entryCount: number
	startEntryIndex: number
}
