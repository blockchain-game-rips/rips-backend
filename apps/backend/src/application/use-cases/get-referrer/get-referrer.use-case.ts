import { Referrer } from '../../../domain/entities/referrer'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type GetReferrerInput = {
	telegramId: TelegramId
}

export abstract class GetReferrerUseCase {
	abstract execute(input: GetReferrerInput): Promise<Referrer>
}
