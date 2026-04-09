import { TelegramId } from 'src/domain/value-objects/telegram-id'
import { TicketPrize } from 'src/domain/value-objects/ticket-prize'

export type GetUnrevealedPrizesInput = {
	telegramId: TelegramId
}

export abstract class GetUnrevealedPrizesUseCase {
	abstract execute(input: GetUnrevealedPrizesInput): Promise<TicketPrize[]>
}
