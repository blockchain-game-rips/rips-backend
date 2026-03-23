import { Address } from 'viem'

export type AddressesActions = {
	purchases: AddressAction[]
	claims: AddressAction[]
	refunds: AddressAction[]
}

export type AddressAction = {
	userAddress: Address
	ticketAmount: bigint
}
