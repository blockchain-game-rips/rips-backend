import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { AdminWallet } from '../../../domain/value-objects/wallet'
import { EncryptedKey } from '../encryption.service'

export abstract class AdminWalletRepository {
	abstract get(): Promise<AdminWallet | null>

	abstract upsert(
		address: EvmAddress,
		encryptedKey: EncryptedKey,
	): Promise<AdminWallet>
}
