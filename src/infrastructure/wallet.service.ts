import { Injectable } from '@nestjs/common'
import { WalletService } from 'src/application/interfaces/wallet.service'
import { EIP155 } from 'src/constants'
import { Currency } from 'src/domain/entities/currency'
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
import { EvmClientService } from './evm/evm-client/evm-client.service'
import { EvmCurrency } from './evm/primitives/currencies/currency'
import { NativeCurrency } from './evm/primitives/currencies/native-currency'
import { Token } from './evm/primitives/currencies/token'
import { SignService } from './sign.service'

@Injectable()
export class WalletServiceImpl extends WalletService {
	constructor(
		private readonly signService: SignService,
		private readonly evmClientService: EvmClientService,
	) {
		super()
	}

	balanceOf(wallet: Wallet, currency: Currency): Promise<bigint> {
		if (currency instanceof EvmCurrency) {
			const userAddress = getAddress(wallet.namespaceToAddress[EIP155])

			const balance = currency.balanceOf(userAddress)

			return balance
		}

		throw new Error(`Unsupported currency: ${currency.id}`)
	}

	async transfer(
		wallet: Wallet,
		args: {
			currency: Currency
			from: ChainAddress
			to: ChainAddress
			amount: bigint
		},
	): Promise<Transaction> {
		const { currency, from: sender, to: recipient, amount } = args

		if (!(currency instanceof EvmCurrency)) {
			throw new Error(`Unsupported currency: ${currency.id}`)
		}

		const chainId = Number(sender.chain.reference)
		const senderAddress = getAddress(sender.address)
		const recipientAddress = getAddress(recipient.address)
		const client = this.evmClientService.getClient(chainId)

		const request = this.buildTransactionRequest(currency, {
			senderAddress,
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
			senderAddress: Address
			recipientAddress: Address
			amount: bigint
		},
	): TransactionRequestEIP1559 {
		const { recipientAddress, amount } = params

		if (currency instanceof NativeCurrency) {
			return { to: recipientAddress, value: amount }
		}

		if (currency instanceof Token) {
			return {
				to: currency.address,
				data: encodeFunctionData({
					abi: erc20Abi,
					functionName: 'transfer',
					args: [recipientAddress, amount],
				}),
			}
		}

		throw new Error(`Unsupported EvmCurrency type: ${currency.id}`)
	}
}
