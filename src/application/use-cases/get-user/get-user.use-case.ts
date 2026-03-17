import { User } from 'src/domain/entities/user'
import { TelegramId } from 'src/domain/value-objects/telegram-id'
import { createCustomError } from 'src/utils/common'

export const UserNotFoundError = createCustomError('UserNotFoundError')

export type GetUserInput = {
	telegramId: TelegramId
}

export interface GetUserUseCase {
	execute(input: GetUserInput): Promise<User>
}

export const GET_USER_USE_CASE_TOKEN = Symbol('GET_USER_USE_CASE_TOKEN')
