import { User } from 'src/domain/entities/user'
import { TelegramId } from 'src/domain/value-objects/telegram-id'

export type SetReferrerInput = {
	telegramId: TelegramId
	referrerAddress: string
}

export abstract class SetReferrerUseCase {
	abstract execute(input: SetReferrerInput): Promise<User>
}
