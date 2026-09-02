import { Inject, Injectable } from '@nestjs/common'
import {
	encodeFunctionData,
	zeroAddress,
	type TransactionRequestEIP1559,
} from 'viem'
import { RipsService } from '../../application/interfaces/rips.service'
import { Config } from '../../domain/entities/config'
import { evmAddressFromWallet } from '../../domain/services/evm'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { CurrencyAmount } from '../../domain/value-objects/currency-amount'
import {
	EvmAddress,
	toEvmAddress,
} from '../../domain/value-objects/evm-address'
import { Purchase } from '../../domain/value-objects/purchase'
import { TransactionQuote } from '../../domain/value-objects/transaction'
import {
	TransactionAttempt,
	TransactionAttemptWith,
} from '../../domain/value-objects/transaction-attempt'
import { Wallet } from '../../domain/value-objects/wallet'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { EvmTransactionService } from '../evm/evm-transaction.service'
import { TransactionFeeService } from '../evm/transaction-fee.service'
import {
	toAttemptWithParsedResult,
	toTransactionAttempt,
} from '../evm/utils/to-transaction-attempt'
import { parsePurchase } from './parse-purchase'
import { parseWithdrawnFee } from './parse-withdrawn-fee'
import { ripsAbi } from './rips-abi'
import { RIPS_CONTRACT } from './rips.constants'

/**
 * The worst case a buyer can reach today is one entry per chunk, so this covers
 * a whole rip in a single transaction. It is a gas bet on the current presets:
 * a chunk holds up to the contract's MAX_ENTRIES_PER_CHUNK entries and costs
 * gas per entry, so an entryCap large enough to fill this many whole chunks for
 * one buyer would not fit in a block. Revisit alongside any entryCap increase.
 */
const CLAIM_MAX_CHUNKS = 128n
const BUY_ENTRIES_GAS = 800_000n
const WITHDRAW_REWARD_GAS = 300_000n

@Injectable()
export class RipsServiceIpml implements RipsService {
	private readonly contractAddress: EvmAddress
	private readonly chainId: number

	constructor(
		private readonly evmTransactionService: EvmTransactionService,
		private readonly evmCurrencyService: EvmCurrencyService,
		private readonly transactionFeeService: TransactionFeeService,

		@Inject(RIPS_CONTRACT) contract: ChainAddress,
	) {
		this.contractAddress = toEvmAddress(contract.address)
		this.chainId = Number(contract.chain.reference)
	}

	claim(
		wallet: Wallet,
		args: {
			ripId: number
			userAddress: EvmAddress
			referrerAddress: EvmAddress | null
		},
	): Promise<TransactionAttempt> {
		return this.sendKeeperTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'claimPayout',
				args: [
					BigInt(args.ripId),
					CLAIM_MAX_CHUNKS,
					args.userAddress,
					args.referrerAddress ?? zeroAddress,
				],
			}),
		})
	}

	refund(
		wallet: Wallet,
		args: { ripId: number; userAddress: EvmAddress },
	): Promise<TransactionAttempt> {
		return this.sendKeeperTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'refund',
				args: [BigInt(args.ripId), args.userAddress],
			}),
		})
	}

	requestVrf(
		wallet: Wallet,
		args: { ripId: number },
	): Promise<TransactionAttempt> {
		return this.sendKeeperTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'requestRandomness',
				args: [BigInt(args.ripId)],
			}),
		})
	}

	private async sendKeeperTransaction(
		wallet: Wallet,
		requestFields: Pick<TransactionRequestEIP1559, 'data'>,
	): Promise<TransactionAttempt> {
		const request: TransactionRequestEIP1559 = {
			...requestFields,
			to: this.contractAddress,
		}

		const result = await this.evmTransactionService.sendTransaction(
			wallet,
			request,
			this.chainId,
		)

		return toTransactionAttempt(result)
	}

	async quoteBuyEntries(): Promise<TransactionQuote> {
		return {
			blockchainFee: await this.transactionFeeService.estimateFee(
				BUY_ENTRIES_GAS,
				this.chainId,
			),
		}
	}

	async quoteWithdrawReward(): Promise<TransactionQuote> {
		return {
			blockchainFee: await this.transactionFeeService.estimateFee(
				WITHDRAW_REWARD_GAS,
				this.chainId,
			),
		}
	}

	async buyEntries(
		wallet: Wallet,
		args: { presetId: number; config: Config; entryCount: number },
	): Promise<TransactionAttemptWith<Purchase>> {
		const { presetId, config, entryCount } = args

		const chainId = this.chainId
		const userAddress = evmAddressFromWallet(wallet)

		const totalValue = config.entryPrice.amount * BigInt(entryCount)

		const request: TransactionRequestEIP1559 = {
			to: this.contractAddress,
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'enterRip',
				args: [BigInt(presetId), BigInt(entryCount), userAddress],
			}),
			value: totalValue,
		}

		const result = await this.evmTransactionService.sendTransaction(
			wallet,
			request,
			chainId,
		)

		return toAttemptWithParsedResult(result, (receipt) =>
			parsePurchase(receipt, this.contractAddress),
		)
	}

	async withdrawReward(
		wallet: Wallet,
		args: { currencyAddress: EvmAddress },
	): Promise<TransactionAttemptWith<CurrencyAmount>> {
		const { currencyAddress } = args

		const chainId = this.chainId
		const referrerAddress = evmAddressFromWallet(wallet)

		const request: TransactionRequestEIP1559 = {
			to: this.contractAddress,
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'withdrawReferrerFee',
				args: [referrerAddress, currencyAddress],
			}),
		}

		const result = await this.evmTransactionService.sendTransaction(
			wallet,
			request,
			chainId,
		)

		const attempt = toAttemptWithParsedResult(result, (receipt) =>
			parseWithdrawnFee(receipt, this.contractAddress),
		)

		if (attempt.status !== 'succeeded') {
			return attempt
		}

		const currency = await this.evmCurrencyService.fromAddress(
			currencyAddress,
			chainId,
		)

		return {
			status: 'succeeded',
			transaction: attempt.transaction,
			result: {
				currency,
				amount: attempt.result,
			},
		}
	}
}
