import { KmsKeyId } from 'src/domain/value-objects/kms-key-id'

export interface KmsKeyResult {
	kmsKeyId: KmsKeyId
	evmAddress: string
}

export abstract class KmsService {
	abstract createEvmKey(): Promise<KmsKeyResult>
	abstract signTransaction(
		kmsKeyId: KmsKeyId,
		hash: string,
		expectedAddress: string,
	): Promise<string>
}
