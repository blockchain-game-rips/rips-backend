import { type Address } from 'viem'

export interface KmsKeyResult {
	kmsKeyId: string
	evmAddress: Address
}

export interface KmsService {
	createEvmKey(): Promise<KmsKeyResult>
}

export const KMS_SERVICE_TOKEN = Symbol('KMS_SERVICE_TOKEN')
