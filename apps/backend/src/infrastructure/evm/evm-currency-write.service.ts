import { Injectable } from '@nestjs/common'
import {
	encodeFunctionData,
	erc20Abi,
	getAddress,
	type Address,
	type TransactionRequestEIP1559,
} from 'viem'
import { evmChainIdFromCurrency } from '../../domain/services/evm'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import {
	Transaction,
	TransactionQuote,
} from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'
import { EvmTransactionService } from './evm-transaction.service'
import { EvmCurrency } from './primitives/currencies/evm-currency'
import { NativeCurrency } from './primitives/currencies/native-currency'
import { Token } from './primitives/currencies/token'
import { TransactionFeeService } from './transaction-fee.service'

const NATIVE_TRANSFER_GAS = 21_000n
const TOKEN_TRANSFER_GAS = 200_000n

@Injectable()
export class EvmCurrencyWriteService {
	constructor(
		private readonly evmTransactionService: EvmTransactionService,
		private readonly transactionFeeService: TransactionFeeService,
	) {}

	async transfer(
		wallet: Wallet,
		args: {
			currency: EvmCurrency
			to: ChainAddress
			amount: bigint
		},
	): Promise<Transaction> {
		const { currency, to: recipient, amount } = args

		const chainId = evmChainIdFromCurrency(currency)
		const recipientAddress = getAddress(recipient.address)

		const request = this.buildTransactionRequest(currency, {
			recipientAddress,
			amount,
		})

		const { transaction } =
			await this.evmTransactionService.sendTransaction(
				wallet,
				request,
				chainId,
			)

		return transaction
	}

	async approve(
		wallet: Wallet,
		args: { token: Token; spender: Address; amount: bigint },
	): Promise<Transaction> {
		const { token, spender, amount } = args

		const chainId = evmChainIdFromCurrency(token)

		const request: TransactionRequestEIP1559 = {
			to: getAddress(token.chainAddress.address),
			data: encodeFunctionData({
				abi: erc20Abi,
				functionName: 'approve',
				args: [spender, amount],
			}),
		}

		const { transaction } =
			await this.evmTransactionService.sendTransaction(
				wallet,
				request,
				chainId,
			)

		return transaction
	}

	async quoteTransfer(args: {
		currency: EvmCurrency
		to: ChainAddress
		amount: bigint
	}): Promise<TransactionQuote> {
		const chainId = evmChainIdFromCurrency(args.currency)

		const gasUnits =
			args.currency instanceof NativeCurrency
				? NATIVE_TRANSFER_GAS
				: TOKEN_TRANSFER_GAS

		return {
			blockchainFee: await this.transactionFeeService.estimateFee(
				gasUnits,
				chainId,
			),
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
