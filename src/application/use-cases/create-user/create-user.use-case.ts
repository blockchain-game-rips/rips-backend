import { User } from 'src/domain/entities/user'
import { TelegramId } from 'src/domain/value-objects/telegram-id'
import { createCustomError } from 'src/utils/common'

export const UserAlreadyExistsError = createCustomError(
	'UserAlreadyExistsError',
)

export type CreateUserInput = {
	telegramId: TelegramId
}

export interface CreateUserUseCase {
	execute(input: CreateUserInput): Promise<User>
}

export const CREATE_USER_USE_CASE_TOKEN = Symbol('CREATE_USER_USE_CASE_TOKEN')
