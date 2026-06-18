import { User } from '../../../domain/entities/user'
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export { UserNotFoundError }

export type GetUserInput = {
	telegramId: TelegramId
}

export abstract class GetUserUseCase {
	abstract execute(input: GetUserInput): Promise<User>
}
