import { Injectable, NotFoundException } from '@nestjs/common'
import { KmsService } from 'src/application/interfaces/kms.service'
import { EvmWalletRepository } from 'src/application/interfaces/repositories/evm-wallet.repository'
import { EIP155 } from 'src/constants'
import { Wallet } from 'src/domain/value-objects/wallet'
import {
	getAddress,
	keccak256,
	parseSignature,
	serializeTransaction,
	type TransactionSerializableEIP1559,
	type TransactionSerialized,
} from 'viem'

@Injectable()
export class SignService {
	constructor(
		private readonly kmsService: KmsService,
		private readonly evmWalletRepository: EvmWalletRepository,
	) {}

	async signTx(
		wallet: Wallet,
		tx: TransactionSerializableEIP1559,
	): Promise<TransactionSerialized> {
		const address = getAddress(wallet.namespaceToAddress[EIP155])

		const evmWallet = await this.evmWalletRepository.findByAddress(address)

		if (!evmWallet) {
			throw new NotFoundException(
				`EvmWallet not found for address ${address}`,
			)
		}

		const serializedUnsigned = serializeTransaction(tx)
		const hash = keccak256(serializedUnsigned)

		const signatureHex = await this.kmsService.signTransaction(
			evmWallet.kmsKeyId,
			hash,
			address,
		)

		const signature = parseSignature(signatureHex as `0x${string}`)

		return serializeTransaction(tx, signature)
	}
}
