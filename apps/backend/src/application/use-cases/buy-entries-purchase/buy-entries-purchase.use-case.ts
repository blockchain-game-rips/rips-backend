import { ChainAddress } from '../../../domain/value-objects/chain-address'
import { PurchaseReceipt } from '../../../domain/value-objects/purchase-receipt'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type BuyEntriesPurchaseInput = {
	telegramId: TelegramId
	presetId: number
	entryCount: number
	paymentCurrencyChainAddress: ChainAddress
}

export abstract class BuyEntriesPurchaseUseCase {
	abstract execute(input: BuyEntriesPurchaseInput): Promise<PurchaseReceipt>
}
