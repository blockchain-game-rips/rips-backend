import { type Address } from 'viem'

export type EvmWalletRecord = {
	kmsKeyId: string
	address: Address
}

export abstract class EvmWalletRepository {
	abstract findByAddress(address: Address): Promise<EvmWalletRecord | null>
}
