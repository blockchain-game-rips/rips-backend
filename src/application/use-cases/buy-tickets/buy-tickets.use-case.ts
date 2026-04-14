import { Currency } from 'src/domain/entities/currency'
import { Purchase } from 'src/domain/value-objects/purchase'
import { TelegramId } from 'src/domain/value-objects/telegram-id'
import { Transaction } from 'src/domain/value-objects/transaction'

export type BuyTicketsInput = {
	telegramId: TelegramId
	stakeId: number
	ticketCount: number
	paymentCurrency: Currency
}

export type BuyTicketsResult =
	| { type: 'settled'; purchase: Purchase }
	| { type: 'pending'; transaction: Transaction }

export abstract class BuyTicketsUseCase {
	abstract execute(input: BuyTicketsInput): Promise<BuyTicketsResult>
}
