import { Injectable } from '@nestjs/common'
import {
	Chain,
	FallbackTransport,
	Hash,
	Hex,
	PublicClient,
	TransactionReceipt,
	type TransactionRequestEIP1559,
} from 'viem'
import { evmAddressFromWallet } from '../../domain/services/evm'
import { Transaction } from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'
import { SignService } from '../sign/sign.service'
import { EvmClientService } from './evm-client/evm-client.service'
import { EvmCurrencyService } from './evm-currency.service'
import {
	classifySendFailure,
	SendFailure,
	SendPhase,
} from './utils/classify-send-failure'

type ChainClient = PublicClient<FallbackTransport, Chain, undefined, undefined>

/**
 * The receipt is carried on both mined arms because services parse event logs
 * from it, and the cause on the failed arms so callers can log it.
 */
export type SendTransactionResult =
	| {
			status: 'succeeded'
			transaction: Transaction
			receipt: TransactionReceipt
	  }
	| {
			status: 'reverted'
			transaction: Transaction
			receipt: TransactionReceipt
	  }
	| SendFailure

@Injectable()
export class EvmTransactionService {
	constructor(
		private readonly evmClientService: EvmClientService,
		private readonly evmCurrencyService: EvmCurrencyService,
		private readonly signService: SignService,
	) {}

	/**
	 * Total: every failure, including a programmer error, is reported as a
	 * status rather than thrown.
	 */
	async sendTransaction(
		wallet: Wallet,
		request: TransactionRequestEIP1559,
		chainId: number,
	): Promise<SendTransactionResult> {
		let client: ChainClient
		let signedTx: Hex

		try {
			client = this.evmClientService.getClient(chainId)

			const preparedTx = await client.prepareTransactionRequest({
				...request,
				account: evmAddressFromWallet(wallet),
				chainId,
			})

			signedTx = await this.signService.signTx(wallet, preparedTx)
		} catch (cause) {
			return classifySendFailure(SendPhase.Preparation, cause)
		}

		let txHash: Hash

		try {
			txHash = await client.sendRawTransaction({
				serializedTransaction: signedTx,
			})
		} catch (cause) {
			return classifySendFailure(SendPhase.Broadcast, cause)
		}

		try {
			const receipt = await client.waitForTransactionReceipt({
				hash: txHash,
			})

			const transaction = this.evmCurrencyService.toTransaction(
				receipt,
				chainId,
			)

			return receipt.status === 'reverted'
				? { status: 'reverted', transaction, receipt }
				: { status: 'succeeded', transaction, receipt }
		} catch (cause) {
			return classifySendFailure(SendPhase.Receipt, cause, txHash)
		}
	}
}
