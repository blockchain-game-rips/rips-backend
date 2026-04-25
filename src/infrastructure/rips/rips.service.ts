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
import { ChainAddress } from '../../domain/value-objects/chain-address'
import {
	EvmAddress,
	toEvmAddress,
} from '../../domain/value-objects/evm-address'
import { PurchaseReceipt } from '../../domain/value-objects/purchase-receipt'
import { Reward } from '../../domain/value-objects/reward'
import { Transaction } from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'
import { EvmClientService } from '../evm/evm-client/evm-client.service'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { EvmTransactionService } from '../evm/evm-transaction.service'
import { evmAddressFromWallet } from '../evm/helpers'
import { parsePurchase } from './parse-purchase'
import { ripsAbi } from './rips-abi'
import { RIPS_CONTRACT } from './rips.constants'

const CLAIM_START_INDEX = 0n
const CLAIM_MAX_RANGES = 100n

@Injectable()
export class RipsServiceIpml implements RipsService {
	private readonly contractAddress: EvmAddress
	private readonly chainId: number

	constructor(
		private readonly evmTransactionService: EvmTransactionService,
		private readonly evmClientService: EvmClientService,
		private readonly evmCurrencyService: EvmCurrencyService,

		@Inject(RIPS_CONTRACT) contract: ChainAddress,
	) {
		this.contractAddress = toEvmAddress(contract.address)
		this.chainId = Number(contract.chain.reference)
	}

	claim(
		wallet: Wallet,
		args: {
			roundId: number
			userAddress: EvmAddress
			referrerAddress: EvmAddress | null
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
					args.userAddress,
					args.referrerAddress ?? zeroAddress,
				],
			}),
		})
	}

	refund(
		wallet: Wallet,
		args: { roundId: number; userAddress: EvmAddress },
	): Promise<Transaction> {
		return this.sendKeeperTransaction(wallet, {
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'refund',
				args: [BigInt(args.roundId), args.userAddress],
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

	async buyTickets(
		wallet: Wallet,
		args: { stakeId: number; config: Config; ticketCount: number },
	): Promise<PurchaseReceipt> {
		const { stakeId, config, ticketCount } = args

		const chainId = this.chainId
		const userAddress = evmAddressFromWallet(wallet)

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

	async getConfigByRoundId(roundId: number): Promise<Config> {
		const chainId = this.chainId
		const client = this.evmClientService.getClient(chainId)

		const round = await client.readContract({
			address: this.contractAddress,
			abi: ripsAbi,
			functionName: 'roundIdToRound',
			args: [BigInt(roundId)],
		})

		const [, configId] = round

		const config = await client.readContract({
			address: this.contractAddress,
			abi: ripsAbi,
			functionName: 'configIdToConfig',
			args: [configId],
		})

		const [currencyAddress, ticketCap, duration, ticketCost, feePercent] =
			config

		const currency = await this.evmCurrencyService.fromAddress(
			currencyAddress,
			chainId,
		)

		// TODO: fetch actual prize tiers from contract
		return {
			id: Number(configId),
			ticketCup: Number(ticketCap),
			feePercent: Number(feePercent),
			ticketPrice: {
				currency,
				amount: ticketCost,
			},
			durationSeconds: Number(duration),
			prizeDistribution: [],
		}
	}
}
