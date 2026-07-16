import { User } from '../../../domain/entities/user'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { EncryptedKey } from '../encryption.service'

export abstract class UserRepository {
	abstract findByTelegramId(telegramId: TelegramId): Promise<User | null>

	abstract findByEvmAddress(address: EvmAddress): Promise<User | null>

	abstract create(
		telegramId: TelegramId,
		address: EvmAddress,
		encryptedKey: EncryptedKey,
		referrerAddress: EvmAddress | undefined,
	): Promise<User>

	abstract setReferrer(
		userId: bigint,
		referrerAddress: EvmAddress | null,
	): Promise<User>
}
