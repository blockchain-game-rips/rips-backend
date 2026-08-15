import { ChainAddress } from '../../../domain/value-objects/chain-address'
import { Purchase } from '../../../domain/value-objects/purchase'
import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { TransactionAttemptWith } from '../../../domain/value-objects/transaction-attempt'

export type BuyEntriesPurchaseInput = {
	telegramId: TelegramId
	presetId: number
	entryCount: number
	paymentCurrencyChainAddress: ChainAddress
}

export abstract class BuyEntriesPurchaseUseCase {
	abstract execute(
		input: BuyEntriesPurchaseInput,
	): Promise<TransactionAttemptWith<Purchase>>
}
