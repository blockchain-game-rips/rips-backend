import { Injectable } from '@nestjs/common'
import {
	getAddress,
	keccak256,
	parseSignature,
	serializeTransaction,
	type TransactionSerializableEIP1559,
	type TransactionSerialized,
} from 'viem'
import { KmsService } from '../../application/interfaces/kms.service'
import { WalletRepository } from '../../application/interfaces/repositories/wallet.repository'
import { EIP155 } from '../../constants'
import { toChainNamespace } from '../../domain/value-objects/chain-namespace'
import { Wallet } from '../../domain/value-objects/wallet'

@Injectable()
export class SignService {
	constructor(
		private readonly kmsService: KmsService,
		private readonly walletRepository: WalletRepository,
	) {}

	async signTx(
		wallet: Wallet,
		tx: TransactionSerializableEIP1559,
	): Promise<TransactionSerialized> {
		const namespace = toChainNamespace(EIP155)
		const address = getAddress(wallet.namespaceToAddress[namespace])

		const kmsKeyId = await this.walletRepository.getKmsKeyId(
			wallet,
			namespace,
		)

		const serializedUnsigned = serializeTransaction(tx)
		const hash = keccak256(serializedUnsigned)

		const signatureHex = await this.kmsService.signTransaction(
			kmsKeyId,
			hash,
			address,
		)

		const signature = parseSignature(signatureHex as `0x${string}`)

		return serializeTransaction(tx, signature)
	}
}
