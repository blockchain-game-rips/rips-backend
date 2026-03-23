import { User } from 'src/domain/entities/user'
import { UserNotFoundError } from 'src/domain/errors/user-not-found.error'
import { TelegramId } from 'src/domain/value-objects/telegram-id'

export { UserNotFoundError }

export type GetUserInput = {
	telegramId: TelegramId
}

export abstract class GetUserUseCase {
	abstract execute(input: GetUserInput): Promise<User>
}
