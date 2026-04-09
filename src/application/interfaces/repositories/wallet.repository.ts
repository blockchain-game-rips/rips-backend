import { ChainNamespace } from 'src/domain/value-objects/chain-namespace'
import { KmsKeyId } from 'src/domain/value-objects/kms-key-id'
import { Wallet } from 'src/domain/value-objects/wallet'

export abstract class WalletRepository {
	abstract getKmsKeyId(
		wallet: Wallet,
		namespace: ChainNamespace,
	): Promise<KmsKeyId>
}
