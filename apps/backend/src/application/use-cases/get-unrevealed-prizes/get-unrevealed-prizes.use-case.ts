import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { TicketPrize } from '../../../domain/value-objects/ticket-prize'

export type GetUnrevealedPrizesInput = {
	telegramId: TelegramId
}

export abstract class GetUnrevealedPrizesUseCase {
	abstract execute(input: GetUnrevealedPrizesInput): Promise<TicketPrize[]>
}
