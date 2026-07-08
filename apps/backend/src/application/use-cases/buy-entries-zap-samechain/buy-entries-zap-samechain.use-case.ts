import { ChainAddress } from '../../../domain/value-objects/chain-address'
import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { SamechainEnterResult } from '../../../domain/value-objects/zap'

export type BuyEntriesZapSamechainInput = {
	telegramId: TelegramId
	presetId: number
	entryCount: number
	paymentCurrencyChainAddress: ChainAddress
}

export abstract class BuyEntriesZapSamechainUseCase {
	abstract execute(
		input: BuyEntriesZapSamechainInput,
	): Promise<SamechainEnterResult>
}
