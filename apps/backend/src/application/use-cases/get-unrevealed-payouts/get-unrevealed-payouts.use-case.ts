import { EntryPayout } from '../../../domain/value-objects/entry-payout'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type GetUnrevealedPayoutsInput = {
	telegramId: TelegramId
}

export abstract class GetUnrevealedPayoutsUseCase {
	abstract execute(input: GetUnrevealedPayoutsInput): Promise<EntryPayout[]>
}
