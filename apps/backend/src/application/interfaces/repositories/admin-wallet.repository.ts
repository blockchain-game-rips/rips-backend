import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { KmsKeyId } from '../../../domain/value-objects/kms-key-id'
import { AdminWallet } from '../../../domain/value-objects/wallet'

export abstract class AdminWalletRepository {
	abstract get(): Promise<AdminWallet | null>

	abstract upsert(
		address: EvmAddress,
		kmsKeyId: KmsKeyId,
	): Promise<AdminWallet>
}
