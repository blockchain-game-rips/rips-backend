import { TicketPrize } from 'src/domain/entities/ticket-prize'
import { TelegramId } from 'src/domain/value-objects/telegram-id'

export type RevealTicketPrizesInput = {
	telegramId: TelegramId
	revealAll: boolean
}

export abstract class RevealTicketPrizesUseCase {
	abstract execute(input: RevealTicketPrizesInput): Promise<TicketPrize[]>
}
