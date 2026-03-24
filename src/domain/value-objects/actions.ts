import { Address } from 'viem'

export type AddressesActions = {
	purchases: PurchaseAction[]
	claims: ClaimAction[]
	refunds: RefundAction[]
}

export type RefundAction = {
	userAddress: Address
	amount: bigint
}

export type ClaimAction = {
	userAddress: Address
	amount: bigint
}

export type PurchaseAction = {
	userAddress: Address
	ticketAmount: bigint
	startTicketIndex: bigint
}
