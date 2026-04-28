import { ChainAddress } from '../../../domain/value-objects/chain-address'
import { PurchaseReceipt } from '../../../domain/value-objects/purchase-receipt'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type BuyTicketsPurchaseInput = {
	telegramId: TelegramId
	stakeId: number
	ticketCount: number
	paymentCurrencyChainAddress: ChainAddress
}

export abstract class BuyTicketsPurchaseUseCase {
	abstract execute(input: BuyTicketsPurchaseInput): Promise<PurchaseReceipt>
}
