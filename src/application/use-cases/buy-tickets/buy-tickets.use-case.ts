import { Purchase } from 'src/domain/value-objects/purchase'
import { TelegramId } from 'src/domain/value-objects/telegram-id'

export type BuyTicketsInput = {
	telegramId: TelegramId
	stakeId: number
	amount: number
}

export abstract class BuyTicketsUseCase {
	abstract execute(input: BuyTicketsInput): Promise<Purchase>
}
