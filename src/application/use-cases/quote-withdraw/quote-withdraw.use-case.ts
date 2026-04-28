import { Currency } from '../../../domain/entities/currency'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { TransactionQuote } from '../../../domain/value-objects/transaction'

export type QuoteWithdrawInput = {
	telegramId: TelegramId
	amountIn: CurrencyAmount
	currencyOut: Currency
	recipientAddress: string
}

export abstract class QuoteWithdrawUseCase {
	abstract execute(input: QuoteWithdrawInput): Promise<TransactionQuote>
}
