import { Currency } from '../../../domain/entities/currency'
import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { SamechainSwapResult } from '../../../domain/value-objects/zap'

export type SwapSamechainInput = {
	telegramId: TelegramId
	currencyIn: Currency
	currencyOut: Currency
	amountIn: bigint
}

export abstract class SwapSamechainUseCase {
	abstract execute(input: SwapSamechainInput): Promise<SamechainSwapResult>
}
