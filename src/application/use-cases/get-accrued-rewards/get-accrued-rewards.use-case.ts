import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type GetAccruedRewardsInput = {
	telegramId: TelegramId
}

export abstract class GetAccruedRewardsUseCase {
	abstract execute(input: GetAccruedRewardsInput): Promise<CurrencyAmount[]>
}
