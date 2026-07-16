import { ChainNamespace } from '../../../domain/value-objects/chain-namespace'
import { Wallet } from '../../../domain/value-objects/wallet'
import { EncryptedKey } from '../encryption.service'

export abstract class WalletRepository {
	abstract getEncryptedKey(
		wallet: Wallet,
		namespace: ChainNamespace,
	): Promise<EncryptedKey>
}
