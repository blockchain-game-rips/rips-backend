import { ChainNamespace } from '../../../domain/value-objects/chain-namespace'
import { KmsKeyId } from '../../../domain/value-objects/kms-key-id'
import { Wallet } from '../../../domain/value-objects/wallet'

export abstract class WalletRepository {
	abstract getKmsKeyId(
		wallet: Wallet,
		namespace: ChainNamespace,
	): Promise<KmsKeyId>
}
