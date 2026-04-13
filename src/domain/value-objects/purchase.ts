import { Transaction } from './transaction'

export type Purchase = {
	transaction: Transaction
	ticketCount: number
	roundId: number
}
