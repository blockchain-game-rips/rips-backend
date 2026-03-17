import { User } from 'src/domain/entities/user'
import { TelegramId } from 'src/domain/value-objects/telegram-id'
import { type Address } from 'viem'

export abstract class UserRepository {
	abstract findByTelegramId(telegramId: TelegramId): Promise<User | null>

	abstract create(
		telegramId: TelegramId,
		address: Address,
		kmsKeyId: string,
	): Promise<User>
}
