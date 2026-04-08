import { KmsKeyId } from 'src/domain/value-objects/kms-key-id'

export type EvmWalletRecord = {
	kmsKeyId: KmsKeyId
	address: string
}

export abstract class EvmWalletRepository {
	abstract findByAddress(address: string): Promise<EvmWalletRecord | null>
}
