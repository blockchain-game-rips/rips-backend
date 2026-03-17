import { User } from 'src/domain/entities/user'
import { TelegramId } from 'src/domain/value-objects/telegram-id'
import { createCustomError } from 'src/utils/common'

export const UserAlreadyExistsError = createCustomError(
	'UserAlreadyExistsError',
)

export type CreateUserInput = {
	telegramId: TelegramId
}

export abstract class CreateUserUseCase {
	abstract execute(input: CreateUserInput): Promise<User>
}
