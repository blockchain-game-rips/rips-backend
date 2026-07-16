import { Injectable } from '@nestjs/common'
import { type Hex, type TransactionSerializableEIP1559 } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { EncryptionService } from '../../application/interfaces/encryption.service'
import { WalletRepository } from '../../application/interfaces/repositories/wallet.repository'
import { EIP155 } from '../../constants'
import { toChainNamespace } from '../../domain/value-objects/chain-namespace'
import { Wallet } from '../../domain/value-objects/wallet'

@Injectable()
export class SignService {
	constructor(
		private readonly encryptionService: EncryptionService,
		private readonly walletRepository: WalletRepository,
	) {}

	async signTx(
		wallet: Wallet,
		tx: TransactionSerializableEIP1559,
	): Promise<Hex> {
		const namespace = toChainNamespace(EIP155)

		const encryptedKey = await this.walletRepository.getEncryptedKey(
			wallet,
			namespace,
		)

		const privateKey = await this.encryptionService.decrypt(encryptedKey)
		const account = privateKeyToAccount(privateKey)

		return account.signTransaction(tx)
	}
}
