import { type Address } from 'viem'

export interface KmsKeyResult {
	kmsKeyId: string
	evmAddress: Address
}

export abstract class KmsService {
	abstract createEvmKey(): Promise<KmsKeyResult>
}
