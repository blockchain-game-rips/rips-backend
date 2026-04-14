import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type GetBalanceInput = {
	telegramId: TelegramId
}

export abstract class GetBalanceUseCase {
	abstract execute(input: GetBalanceInput): Promise<CurrencyAmount>
}
