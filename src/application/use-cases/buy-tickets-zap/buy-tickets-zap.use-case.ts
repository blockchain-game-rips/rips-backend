import { ChainAddress } from '../../../domain/value-objects/chain-address'
import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { PendingZap } from '../../../domain/value-objects/zap'

export type BuyTicketsZapInput = {
	telegramId: TelegramId
	stakeId: number
	ticketCount: number
	paymentCurrencyChainAddress: ChainAddress
}

export abstract class BuyTicketsZapUseCase {
	abstract execute(input: BuyTicketsZapInput): Promise<PendingZap>
}
