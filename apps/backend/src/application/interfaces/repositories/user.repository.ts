import { User } from '../../../domain/entities/user'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { KmsKeyId } from '../../../domain/value-objects/kms-key-id'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export abstract class UserRepository {
	abstract findByTelegramId(telegramId: TelegramId): Promise<User | null>

	abstract findByEvmAddress(address: EvmAddress): Promise<User | null>

	abstract create(
		telegramId: TelegramId,
		address: EvmAddress,
		kmsKeyId: KmsKeyId,
		referrerAddress: EvmAddress | undefined,
	): Promise<User>

	abstract setReferrer(
		userId: bigint,
		referrerAddress: EvmAddress | null,
	): Promise<User>
}
