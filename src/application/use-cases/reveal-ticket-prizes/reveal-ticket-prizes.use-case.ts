import { TelegramId } from 'src/domain/value-objects/telegram-id'
import { TicketPrize } from 'src/domain/value-objects/ticket-prize'

export type RevealTicketPrizesInput = {
	telegramId: TelegramId
	revealAll: boolean
}

export abstract class RevealTicketPrizesUseCase {
	abstract execute(input: RevealTicketPrizesInput): Promise<TicketPrize[]>
}
