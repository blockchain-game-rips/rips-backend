import { EntryPayout } from '../../../domain/value-objects/entry-payout'
import { PayoutFilter } from '../../../domain/value-objects/payout-filter'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type GetPayoutsInput = {
	telegramId: TelegramId
	filter: PayoutFilter
}

export abstract class GetPayoutsUseCase {
	abstract execute(input: GetPayoutsInput): Promise<EntryPayout[]>
}
