import { User } from 'src/domain/entities/user'
import { TelegramId } from 'src/domain/value-objects/telegram-id'

export abstract class UserRepository {
	abstract findByTelegramId(telegramId: TelegramId): Promise<User | null>

	abstract findByEvmAddress(address: string): Promise<User | null>

	abstract create(
		telegramId: TelegramId,
		address: string,
		kmsKeyId: string,
	): Promise<User>
}
