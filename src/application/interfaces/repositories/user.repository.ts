import { User } from 'src/domain/entities/user'
import { TelegramId } from 'src/domain/value-objects/telegram-id'
import { type Address } from 'viem'

export interface UserRepository {
	findByTelegramId(telegramId: TelegramId): Promise<User | null>
	create(
		telegramId: TelegramId,
		address: Address,
		kmsKeyId: string,
	): Promise<User>
}

export const USER_REPOSITORY_TOKEN = Symbol('USER_REPOSITORY_TOKEN')
