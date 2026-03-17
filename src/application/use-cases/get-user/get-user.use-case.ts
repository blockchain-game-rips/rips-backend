import { User } from 'src/domain/entities/user'
import { TelegramId } from 'src/domain/value-objects/telegram-id'
import { createCustomError } from 'src/utils/common'

export const UserNotFoundError = createCustomError('UserNotFoundError')

export type GetUserInput = {
	telegramId: TelegramId
}

export abstract class GetUserUseCase {
	abstract execute(input: GetUserInput): Promise<User>
}
