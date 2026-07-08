import { Currency } from '../../../domain/entities/currency'
import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { SamechainSwapQuoteResult } from '../../../domain/value-objects/zap'

export type QuoteSwapSamechainInput = {
	telegramId: TelegramId
	currencyIn: Currency
	currencyOut: Currency
	amountIn: bigint
}

export abstract class QuoteSwapSamechainUseCase {
	abstract execute(
		input: QuoteSwapSamechainInput,
	): Promise<SamechainSwapQuoteResult>
}
