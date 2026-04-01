export interface KmsKeyResult {
	kmsKeyId: string
	evmAddress: string
}

export abstract class KmsService {
	abstract createEvmKey(): Promise<KmsKeyResult>
	abstract signTransaction(
		kmsKeyId: string,
		hash: string,
		expectedAddress: string,
	): Promise<string>
}
