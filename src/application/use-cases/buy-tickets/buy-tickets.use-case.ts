import { ChainAddress } from '../../../domain/value-objects/chain-address'
import { PurchaseOutcome } from '../../../domain/value-objects/purchase-outcome'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type BuyTicketsInput = {
	telegramId: TelegramId
	stakeId: number
	ticketCount: number
	paymentCurrencyChainAddress: ChainAddress
}

export abstract class BuyTicketsUseCase {
	abstract execute(input: BuyTicketsInput): Promise<PurchaseOutcome>
}
