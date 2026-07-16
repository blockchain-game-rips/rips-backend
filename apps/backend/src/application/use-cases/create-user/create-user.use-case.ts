import { User } from '../../../domain/entities/user'
import { UserAlreadyExistsError } from '../../../domain/errors/user-already-exists.error'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { PrivateKey } from '../../../domain/value-objects/private-key'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export { UserAlreadyExistsError }

export type CreateUserInput = {
	telegramId: TelegramId
	referrerAddress?: EvmAddress
	privateKey?: PrivateKey
}

export abstract class CreateUserUseCase {
	abstract execute(input: CreateUserInput): Promise<User>
}
