import { ChainAddress } from '../../../domain/value-objects/chain-address'
import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { PendingZap } from '../../../domain/value-objects/zap'

export type BuyEntriesZapInput = {
	telegramId: TelegramId
	presetId: number
	entryCount: number
	paymentCurrencyChainAddress: ChainAddress
}

export abstract class BuyEntriesZapUseCase {
	abstract execute(input: BuyEntriesZapInput): Promise<PendingZap>
}
