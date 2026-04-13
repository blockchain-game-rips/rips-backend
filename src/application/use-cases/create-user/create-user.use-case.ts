import { User } from 'src/domain/entities/user'
import { UserAlreadyExistsError } from 'src/domain/errors/user-already-exists.error'
import { TelegramId } from 'src/domain/value-objects/telegram-id'

export { UserAlreadyExistsError }

export type CreateUserInput = {
	telegramId: TelegramId
	referrerAddress: string | null
}

export abstract class CreateUserUseCase {
	abstract execute(input: CreateUserInput): Promise<User>
}
