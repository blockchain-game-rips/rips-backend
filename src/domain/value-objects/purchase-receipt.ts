import { Purchase } from './purchase'
import { Transaction } from './transaction'

export type PurchaseReceipt = {
	purchase: Purchase
	transaction: Transaction
}
