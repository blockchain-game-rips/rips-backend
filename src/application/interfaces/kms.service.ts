import { EvmAddress } from '../../domain/value-objects/evm-address'
import { KmsKeyId } from '../../domain/value-objects/kms-key-id'

export interface KmsKeyResult {
	kmsKeyId: KmsKeyId
	evmAddress: EvmAddress
}

export abstract class KmsService {
	abstract createEvmKey(): Promise<KmsKeyResult>
	abstract signTransaction(
		kmsKeyId: KmsKeyId,
		hash: string,
		expectedAddress: EvmAddress,
	): Promise<string>
}
