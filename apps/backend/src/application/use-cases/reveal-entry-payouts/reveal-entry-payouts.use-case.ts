import { EntryPayout } from '../../../domain/value-objects/entry-payout'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type RevealEntryPayoutsInput = {
	telegramId: TelegramId
	revealAll: boolean
}

export abstract class RevealEntryPayoutsUseCase {
	abstract execute(input: RevealEntryPayoutsInput): Promise<EntryPayout[]>
}
