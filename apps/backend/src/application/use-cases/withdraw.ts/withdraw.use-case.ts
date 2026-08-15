import { Currency } from '../../../domain/entities/currency'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { TransactionAttempt } from '../../../domain/value-objects/transaction-attempt'

export type WithdrawInput = {
	telegramId: TelegramId
	amountIn: CurrencyAmount
	currencyOut: Currency
	recipientAddress: string
}

export abstract class WithdrawUseCase {
	abstract execute(input: WithdrawInput): Promise<TransactionAttempt>
}
