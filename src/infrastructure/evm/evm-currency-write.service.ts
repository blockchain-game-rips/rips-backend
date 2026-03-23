import { Injectable } from '@nestjs/common'
import { TransactionFailedError } from 'src/domain/errors/transaction-failed.error'
import { ChainAddress } from 'src/domain/value-objects/chain-address'
import { Transaction } from 'src/domain/value-objects/transaction'
import { Wallet } from 'src/domain/value-objects/wallet'
import {
	encodeFunctionData,
	erc20Abi,
	getAddress,
	type Address,
	type TransactionRequestEIP1559,
} from 'viem'
import { SignService } from '../sign.service'
import { EvmClientService } from './evm-client/evm-client.service'
import { EvmCurrency } from './primitives/currencies/evm-currency'
import { Token } from './primitives/currencies/token'

@Injectable()
export class EvmCurrencyWriteService {
	constructor(
		private readonly evmClientService: EvmClientService,
		private readonly signService: SignService,
	) {}

	async transfer(
		wallet: Wallet,
		args: {
			currency: EvmCurrency
			from: ChainAddress
			to: ChainAddress
			amount: bigint
		},
	): Promise<Transaction> {
		const { currency, from: sender, to: recipient, amount } = args

		const chainId = Number(sender.chain.reference)
		const senderAddress = getAddress(sender.address)
		const recipientAddress = getAddress(recipient.address)
		const client = this.evmClientService.getClient(chainId)

		const request = this.buildTransactionRequest(currency, {
			recipientAddress,
			amount,
		})

		const tx = await client
			.prepareTransactionRequest({
				...request,
				account: senderAddress,
				chainId,
			})
			.catch((cause) => {
				throw new TransactionFailedError('Gas estimation failed', cause)
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
			id: txHash,
			cost: {
				currency,
				amount: gasCost,
			},
		}
	}

	private buildTransactionRequest(
		currency: EvmCurrency,
		params: {
			recipientAddress: Address
			amount: bigint
		},
	): TransactionRequestEIP1559 {
		const { recipientAddress, amount } = params

		if (currency instanceof Token) {
			return {
				to: getAddress(currency.chainAddress.address),
				data: encodeFunctionData({
					abi: erc20Abi,
					functionName: 'transfer',
					args: [recipientAddress, amount],
				}),
			}
		}

		return { to: recipientAddress, value: amount }
	}
}
