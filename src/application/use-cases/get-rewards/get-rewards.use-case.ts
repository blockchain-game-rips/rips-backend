import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type GetRewardsInput = {
	telegramId: TelegramId
}

export abstract class GetRewardsUseCase {
	abstract execute(input: GetRewardsInput): Promise<CurrencyAmount[]>
}
