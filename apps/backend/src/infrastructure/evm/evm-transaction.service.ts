import { Injectable, Logger } from '@nestjs/common'
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
	private readonly logger = new Logger(EvmTransactionService.name)

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
		const context = {
			chainId,
			from: evmAddressFromWallet(wallet),
			walletKind: wallet.kind,
			to: request.to,
			data: request.data,
		}

		const fail = (
			phase: SendPhase,
			cause: unknown,
			txHash?: Hash,
		): SendFailure => {
			const failure = classifySendFailure(phase, cause, txHash)

			this.logger.error(
				{
					...context,
					status: failure.status,
					phase,
					txHash,
					err: cause,
				},
				'Transaction send failed',
			)

			return failure
		}

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
			return fail(SendPhase.Preparation, cause)
		}

		let txHash: Hash

		try {
			txHash = await client.sendRawTransaction({
				serializedTransaction: signedTx,
			})
		} catch (cause) {
			return fail(SendPhase.Broadcast, cause)
		}

		try {
			const receipt = await client.waitForTransactionReceipt({
				hash: txHash,
			})

			const transaction = this.evmCurrencyService.toTransaction(
				receipt,
				chainId,
			)

			if (receipt.status === 'reverted') {
				this.logger.warn(
					{
						...context,
						status: 'reverted',
						txHash,
						gasUsed: receipt.gasUsed.toString(),
					},
					'Transaction reverted',
				)

				return { status: 'reverted', transaction, receipt }
			}

			this.logger.log(
				{
					...context,
					status: 'succeeded',
					txHash,
					gasUsed: receipt.gasUsed.toString(),
				},
				'Transaction succeeded',
			)

			return { status: 'succeeded', transaction, receipt }
		} catch (cause) {
			return fail(SendPhase.Receipt, cause, txHash)
		}
	}
}
