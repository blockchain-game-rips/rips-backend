import { Injectable } from '@nestjs/common'
import { TransactionFailedError } from 'src/domain/errors/transaction-failed.error'
import { Transaction } from 'src/domain/value-objects/transaction'
import { Wallet } from 'src/domain/value-objects/wallet'
import {
	Address,
	TransactionReceipt,
	type TransactionRequestEIP1559,
} from 'viem'
import { SignService } from '../sign/sign.service'
import { EvmClientService } from './evm-client/evm-client.service'
import { EvmCurrencyService } from './evm-currency.service'

// TODO: SignService uses EvmWalletRepository which only resolves user accounts.
// Keeper wallet signing is not yet supported — to be addressed later.

export type TransactionResult = {
	transaction: Transaction
	receipt: TransactionReceipt
}

@Injectable()
export class EvmTransactionService {
	constructor(
		private readonly evmClientService: EvmClientService,
		private readonly evmCurrencyService: EvmCurrencyService,
		private readonly signService: SignService,
	) {}

	async sendTransaction(
		wallet: Wallet,
		senderAddress: Address,
		request: TransactionRequestEIP1559,
		chainId: number,
	): Promise<TransactionResult> {
		const client = this.evmClientService.getClient(chainId)
		const nativeCurrency = this.evmCurrencyService.getNative(chainId)

		const tx = await client
			.prepareTransactionRequest({
				...request,
				account: senderAddress,
				chainId,
			})
			.catch((cause) => {
				throw new TransactionFailedError(
					'Transaction simulation failed',
					cause,
				)
			})

		const signedTx = await this.signService.signTx(wallet, tx)

		const txHash = await client.sendRawTransaction({
			serializedTransaction: signedTx,
		})

		const receipt = await client.waitForTransactionReceipt({ hash: txHash })

		if (receipt.status === 'reverted') {
			throw new TransactionFailedError(`Transaction reverted: ${txHash}`)
		}

		const gasCost = receipt.gasUsed * receipt.effectiveGasPrice

		return {
			transaction: {
				id: txHash,
				cost: {
					currency: nativeCurrency,
					amount: gasCost,
				},
			},
			receipt,
		}
	}
}
