import { Currency } from '../../../domain/entities/currency'
import { PurchaseReceipt } from '../../../domain/value-objects/purchase-receipt'
import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { PendingZap } from '../../../domain/value-objects/zap'

export type BuyTicketsInput = {
	telegramId: TelegramId
	stakeId: number
	ticketCount: number
	paymentCurrency: Currency
}

export type BuyTicketsResult =
	| { type: 'settled'; purchaseReceipt: PurchaseReceipt }
	| { type: 'pending'; pendingZap: PendingZap }

export abstract class BuyTicketsUseCase {
	abstract execute(input: BuyTicketsInput): Promise<BuyTicketsResult>
}
