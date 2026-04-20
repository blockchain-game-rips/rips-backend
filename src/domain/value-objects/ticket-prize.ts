import { Card } from './card'

export type TicketPrize = {
	roundId: number
	userAddress: string
	ticketNumber: number
	prizeAmount: bigint
	revealed: boolean
	card: Card
}
