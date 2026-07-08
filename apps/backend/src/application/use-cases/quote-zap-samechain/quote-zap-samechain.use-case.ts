import { ChainAddress } from '../../../domain/value-objects/chain-address'
import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { SamechainEnterQuoteResult } from '../../../domain/value-objects/zap'

export type QuoteZapSamechainInput = {
	telegramId: TelegramId
	presetId: number
	entryCount: number
	paymentCurrencyChainAddress: ChainAddress
}

export abstract class QuoteZapSamechainUseCase {
	abstract execute(
		input: QuoteZapSamechainInput,
	): Promise<SamechainEnterQuoteResult>
}
