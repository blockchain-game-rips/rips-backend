import { CardCollection } from '../../../domain/value-objects/card-collection'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type GetCardCollectionInput = {
	telegramId: TelegramId
	presetId: number
}

export abstract class GetCardCollectionUseCase {
	abstract execute(input: GetCardCollectionInput): Promise<CardCollection[]>
}
