import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { TicketPrize } from '../../../domain/value-objects/ticket-prize'

export type RevealTicketPrizesInput = {
	telegramId: TelegramId
	revealAll: boolean
}

export abstract class RevealTicketPrizesUseCase {
	abstract execute(input: RevealTicketPrizesInput): Promise<TicketPrize[]>
}
