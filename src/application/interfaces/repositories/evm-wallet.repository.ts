export type EvmWalletRecord = {
	kmsKeyId: string
	address: string
}

export abstract class EvmWalletRepository {
	abstract findByAddress(address: string): Promise<EvmWalletRecord | null>
}
