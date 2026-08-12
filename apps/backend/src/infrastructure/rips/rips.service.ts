import { Inject, Injectable } from '@nestjs/common'
import {
	decodeEventLog,
	encodeFunctionData,
	getAddress,
	zeroAddress,
	type TransactionRequestEIP1559,
} from 'viem'
import { RipsService } from '../../application/interfaces/rips.service'
import { Config } from '../../domain/entities/config'
import { TransactionFailedError } from '../../domain/errors/transaction-failed.error'
import { evmAddressFromWallet } from '../../domain/services/evm'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import {
	EvmAddress,
	toEvmAddress,
} from '../../domain/value-objects/evm-address'
import { PurchaseReceipt } from '../../domain/value-objects/purchase-receipt'
import { Reward } from '../../domain/value-objects/reward'
import {
	Transaction,
	TransactionQuote,
} from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'
import { EvmClientService } from '../evm/evm-client/evm-client.service'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { EvmTransactionService } from '../evm/evm-transaction.service'
import { TransactionFeeService } from '../evm/transaction-fee.service'
import { parsePurchase } from './parse-purchase'
import { ripsAbi } from './rips-abi'
import { RIPS_CONTRACT } from './rips.constants'

const CLAIM_START_INDEX = 0n
const CLAIM_MAX_RANGES = 100n
const BUY_ENTRIES_GAS = 800_000n
const WITHDRAW_REWARD_GAS = 300_000n

@Injectable()
export class RipsServiceIpml implements RipsService {
	private readonly contractAddress: EvmAddress
	private readonly chainId: number

	constructor(
		private readonly evmTransactionService: EvmTransactionService,
		private readonly evmClientService: EvmClientService,
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
	): Promise<Transaction> {
		return this.sendKeeperTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'claimPayout',
				args: [
					BigInt(args.ripId),
					CLAIM_START_INDEX,
					CLAIM_MAX_RANGES,
					args.userAddress,
					args.referrerAddress ?? zeroAddress,
				],
			}),
		})
	}

	refund(
		wallet: Wallet,
		args: { ripId: number; userAddress: EvmAddress },
	): Promise<Transaction> {
		return this.sendKeeperTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'refund',
				args: [BigInt(args.ripId), args.userAddress],
			}),
		})
	}

	requestVrf(wallet: Wallet, args: { ripId: number }): Promise<Transaction> {
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
	): Promise<Transaction> {
		const chainId = this.chainId

		const request: TransactionRequestEIP1559 = {
			...requestFields,
			to: this.contractAddress,
		}

		const { transaction } =
			await this.evmTransactionService.sendTransaction(
				wallet,
				request,
				chainId,
			)

		return transaction
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
	): Promise<PurchaseReceipt> {
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

		const { transaction, receipt } =
			await this.evmTransactionService.sendTransaction(
				wallet,
				request,
				chainId,
			)

		const purchase = parsePurchase(receipt, this.contractAddress)

		if (!purchase) {
			throw new TransactionFailedError(
				`RipEntered event not found in transaction: ${transaction.id}`,
			)
		}

		return { transaction, purchase }
	}

	async withdrawReward(
		wallet: Wallet,
		args: { currencyAddress: EvmAddress },
	): Promise<Reward> {
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

		const { transaction, receipt } =
			await this.evmTransactionService.sendTransaction(
				wallet,
				request,
				chainId,
			)

		const log = receipt.logs
			.filter((l) => getAddress(l.address) === this.contractAddress)
			.map((l) => {
				try {
					return decodeEventLog({ abi: ripsAbi, ...l, strict: true })
				} catch {
					return null
				}
			})
			.find((event) => event?.eventName === 'ReferrerFeeWithdrawn')

		if (!log || log.eventName !== 'ReferrerFeeWithdrawn') {
			throw new TransactionFailedError(
				`ReferrerFeeWithdrawn event not found in transaction: ${transaction.id}`,
			)
		}

		const currency = await this.evmCurrencyService.fromAddress(
			currencyAddress,
			chainId,
		)

		return {
			transaction,
			amount: {
				currency,
				amount: log.args.amount,
			},
		}
	}
}
