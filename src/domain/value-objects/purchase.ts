import { TicketAmount } from './ticket-amount'
import { Transaction } from './transaction'

export type Purchase = {
	transaction: Transaction
	ticketAmount: TicketAmount
}
