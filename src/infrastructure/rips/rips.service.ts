import { Inject, Injectable } from '@nestjs/common'
import { RipsService } from 'src/application/interfaces/rips.service'
import { MAIN_CURRENCY } from 'src/application/interfaces/tokens'
import { EIP155 } from 'src/constants'
import { Config } from 'src/domain/entities/config'
import { Currency } from 'src/domain/entities/currency'
import { TransactionFailedError } from 'src/domain/errors/transaction-failed.error'
import { Purchase } from 'src/domain/value-objects/purchase'
import { Transaction } from 'src/domain/value-objects/transaction'
import { Wallet } from 'src/domain/value-objects/wallet'
import {
	decodeEventLog,
	encodeFunctionData,
	getAddress,
	zeroAddress,
	type Address,
	type TransactionRequestEIP1559,
} from 'viem'
import { EvmTransactionService } from '../evm/evm-transaction.service'
import { EvmCurrency } from '../evm/primitives/currencies/evm-currency'
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
		args: { roundId: number; userAddress: string },
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
					zeroAddress,
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
		const keeperAddress = getAddress(wallet.namespaceToAddress[EIP155])

		const request: TransactionRequestEIP1559 = {
			...requestFields,
			to: this.contractAddress,
		}

		const res = await this.evmTransactionService.sendTransaction(
			wallet,
			keeperAddress,
			request,
			chainId,
		)

		return res.transaction
	}

	async buyTickets(
		wallet: Wallet,
		args: { stakeId: number; config: Config; amount: number },
	): Promise<Purchase> {
		const evmCurrency = this.requireEvmCurrency()

		const { stakeId, config, amount } = args

		const chainId = Number(evmCurrency.chainAddress.chain.reference)
		const userAddress = getAddress(wallet.namespaceToAddress[EIP155])

		const totalValue = config.ticketPrice.amount * BigInt(amount)

		const request: TransactionRequestEIP1559 = {
			to: this.contractAddress,
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'buyTickets',
				args: [BigInt(stakeId), BigInt(amount), userAddress],
			}),
			value: totalValue,
		}

		const { transaction, receipt } =
			await this.evmTransactionService.sendTransaction(
				wallet,
				userAddress,
				request,
				chainId,
			)

		const ticketsPurchasedLog = receipt.logs
			.map((log) => {
				try {
					return decodeEventLog({ abi: ripsAbi, ...log })
				} catch {
					return null
				}
			})
			.find((event) => event?.eventName === 'TicketsPurchased')

		if (
			!ticketsPurchasedLog ||
			ticketsPurchasedLog.eventName !== 'TicketsPurchased'
		) {
			throw new TransactionFailedError(
				`TicketsPurchased event not found in transaction: ${transaction.id}`,
			)
		}

		return {
			transaction,
			ticketAmount: {
				roundId: Number(ticketsPurchasedLog.args.roundId),
				amount: Number(ticketsPurchasedLog.args.ticketCount),
			},
		}
	}

	private requireEvmCurrency(): EvmCurrency {
		if (!(this.mainCurrency instanceof EvmCurrency)) {
			throw new Error(`Unsupported currency: ${this.mainCurrency.id}`)
		}

		return this.mainCurrency
	}
}
