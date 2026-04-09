import { Card } from './card'

export type TicketPrize = {
	roundId: number
	ticketNumber: number
	prizeAmount: bigint
	revealed: boolean
	card: Card
}
