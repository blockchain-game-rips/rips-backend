import { User } from '../../../domain/entities/user'
import { KmsKeyId } from '../../../domain/value-objects/kms-key-id'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export abstract class UserRepository {
	abstract findByTelegramId(telegramId: TelegramId): Promise<User | null>

	abstract findByEvmAddress(address: string): Promise<User | null>

	abstract create(
		telegramId: TelegramId,
		address: string,
		kmsKeyId: KmsKeyId,
		referrerAddress: string | null,
	): Promise<User>

	abstract setReferrer(userId: bigint, referrerAddress: string): Promise<User>
}
