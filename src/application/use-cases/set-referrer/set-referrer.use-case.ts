import { User } from '../../../domain/entities/user'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type SetReferrerInput = {
	telegramId: TelegramId
	referrerAddress: string
}

export abstract class SetReferrerUseCase {
	abstract execute(input: SetReferrerInput): Promise<User>
}
