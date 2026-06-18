import { Currency } from '../../../domain/entities/currency'
import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { ZapQuoteSwapResult } from '../../../domain/value-objects/zap'

export type QuoteSwapInput = {
	telegramId: TelegramId
	currencyIn: Currency
	currencyOut: Currency
	amountIn: bigint
}

export abstract class QuoteSwapUseCase {
	abstract execute(input: QuoteSwapInput): Promise<ZapQuoteSwapResult>
}
