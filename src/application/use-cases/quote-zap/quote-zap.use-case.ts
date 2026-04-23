import { ChainAddress } from '../../../domain/value-objects/chain-address'
import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { ZapQuoteBuyResult } from '../../../domain/value-objects/zap'

export type QuoteZapInput = {
	telegramId: TelegramId
	stakeId: number
	ticketCount: number
	paymentCurrencyChainAddress: ChainAddress
}

export abstract class QuoteZapUseCase {
	abstract execute(input: QuoteZapInput): Promise<ZapQuoteBuyResult>
}
