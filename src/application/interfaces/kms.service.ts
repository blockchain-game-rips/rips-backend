import { type Address, type Hex } from 'viem'

export interface KmsKeyResult {
	kmsKeyId: string
	evmAddress: Address
}

export abstract class KmsService {
	abstract createEvmKey(): Promise<KmsKeyResult>
	abstract signTransaction(
		kmsKeyId: string,
		hash: Hex,
		expectedAddress: Address,
	): Promise<Hex>
}
