import { Card } from './card'
import { EvmAddress } from './evm-address'

export type TicketPrize = {
	roundId: number
	userAddress: EvmAddress
	ticketNumber: number
	prizeAmount: bigint
	revealed: boolean
	card: Card
}
