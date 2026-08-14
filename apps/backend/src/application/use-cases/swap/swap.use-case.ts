import { Currency } from '../../../domain/entities/currency'
import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { CrosschainSwapStartResult } from '../../../domain/value-objects/zap'

export type SwapInput = {
	telegramId: TelegramId
	currencyIn: Currency
	currencyOut: Currency
	amountIn: bigint
}

export abstract class SwapUseCase {
	abstract execute(input: SwapInput): Promise<CrosschainSwapStartResult>
}
