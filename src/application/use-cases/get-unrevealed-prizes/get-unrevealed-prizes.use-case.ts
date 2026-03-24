import { TicketPrize } from 'src/domain/entities/ticket-prize'
import { TelegramId } from 'src/domain/value-objects/telegram-id'

export type GetUnrevealedPrizesInput = {
	telegramId: TelegramId
}

export abstract class GetUnrevealedPrizesUseCase {
	abstract execute(input: GetUnrevealedPrizesInput): Promise<TicketPrize[]>
}
