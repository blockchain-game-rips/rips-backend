import { Inject, Injectable } from '@nestjs/common'
import {
	encodeFunctionData,
	getAddress,
	zeroAddress,
	type Address,
	type TransactionRequestEIP1559,
} from 'viem'
import { RipsService } from '../../application/interfaces/rips.service'
import { MAIN_CURRENCY } from '../../application/interfaces/tokens'
import { EIP155 } from '../../constants'
import { Config } from '../../domain/entities/config'
import { Currency } from '../../domain/entities/currency'
import { TransactionFailedError } from '../../domain/errors/transaction-failed.error'
import { PurchaseReceipt } from '../../domain/value-objects/purchase-receipt'
import { Transaction } from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'
import { EvmTransactionService } from '../evm/evm-transaction.service'
import { EvmCurrency } from '../evm/primitives/currencies/evm-currency'
import { parsePurchase } from './parse-purchase'
import { ripsAbi } from './rips-abi'
import { RIPS_SC_ADDRESS } from './rips.constants'

const CLAIM_START_INDEX = 0n
const CLAIM_MAX_RANGES = 100n

@Injectable()
export class RipsServiceIpml implements RipsService {
	constructor(
		private readonly evmTransactionService: EvmTransactionService,

		@Inject(RIPS_SC_ADDRESS) private readonly contractAddress: Address,

		@Inject(MAIN_CURRENCY) private readonly mainCurrency: Currency,
	) {}

	claim(
		wallet: Wallet,
		args: {
			roundId: number
			userAddress: string
			referrerAddress: string | null
		},
	): Promise<Transaction> {
		return this.sendKeeperTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'claimPrizes',
				args: [
					BigInt(args.roundId),
					CLAIM_START_INDEX,
					CLAIM_MAX_RANGES,
					args.userAddress as Address,
					(args.referrerAddress ?? zeroAddress) as Address,
				],
			}),
		})
	}

	refund(
		wallet: Wallet,
		args: { roundId: number; userAddress: string },
	): Promise<Transaction> {
		return this.sendKeeperTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'refund',
				args: [BigInt(args.roundId), args.userAddress as Address],
			}),
		})
	}

	requestVrf(
		wallet: Wallet,
		args: { roundId: number },
	): Promise<Transaction> {
		return this.sendKeeperTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'requestRandomness',
				args: [BigInt(args.roundId)],
			}),
		})
	}

	private async sendKeeperTransaction(
		wallet: Wallet,
		requestFields: Pick<TransactionRequestEIP1559, 'data'>,
	): Promise<Transaction> {
		const evmCurrency = this.requireEvmCurrency()

		const chainId = Number(evmCurrency.chainAddress.chain.reference)

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

	async buyTickets(
		wallet: Wallet,
		args: { stakeId: number; config: Config; ticketCount: number },
	): Promise<PurchaseReceipt> {
		const evmCurrency = this.requireEvmCurrency()

		const { stakeId, config, ticketCount } = args

		const chainId = Number(evmCurrency.chainAddress.chain.reference)
		const userAddress = getAddress(wallet.namespaceToAddress[EIP155])

		const totalValue = config.ticketPrice.amount * BigInt(ticketCount)

		const request: TransactionRequestEIP1559 = {
			to: this.contractAddress,
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'buyTickets',
				args: [BigInt(stakeId), BigInt(ticketCount), userAddress],
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
				`TicketsPurchased event not found in transaction: ${transaction.id}`,
			)
		}

		return { transaction, purchase }
	}

	private requireEvmCurrency(): EvmCurrency {
		if (!(this.mainCurrency instanceof EvmCurrency)) {
			throw new Error(`Unsupported currency: ${this.mainCurrency.id}`)
		}

		return this.mainCurrency
	}
}
