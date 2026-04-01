import { Inject, Injectable } from '@nestjs/common'
import { RipsService } from 'src/application/interfaces/rips.service'
import { MAIN_CURRENCY } from 'src/application/interfaces/tokens'
import { EIP155 } from 'src/constants'
import { Currency } from 'src/domain/entities/currency'
import { Stake } from 'src/domain/entities/stake'
import { TransactionFailedError } from 'src/domain/errors/transaction-failed.error'
import { Purchase } from 'src/domain/value-objects/purchase'
import { Transaction } from 'src/domain/value-objects/transaction'
import { Wallet } from 'src/domain/value-objects/wallet'
import {
	decodeEventLog,
	encodeFunctionData,
	getAddress,
	Hex,
	type Address,
	type TransactionRequestEIP1559,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { EvmClientService } from '../evm/evm-client/evm-client.service'
import { EvmCurrency } from '../evm/primitives/currencies/evm-currency'
import { SignService } from '../sign/sign.service'
import { ripsAbi } from './rips-abi'
import { KEEPER_PK, RIPS_SC_ADDRESS } from './rips.constants'

const CLAIM_START_INDEX = 0n
const CLAIM_MAX_RANGES = 100n

@Injectable()
export class RipsServiceIpml implements RipsService {
	constructor(
		private readonly evmClientService: EvmClientService,
		private readonly signService: SignService,

		@Inject(RIPS_SC_ADDRESS) private readonly contractAddress: Address,

		@Inject(KEEPER_PK) private readonly keeperPk: Hex,

		@Inject(MAIN_CURRENCY) private readonly mainCurrency: Currency,
	) {}

	async claim(roundId: number, userToClaim: Address): Promise<Transaction> {
		const data = encodeFunctionData({
			abi: ripsAbi,
			functionName: 'claimPrizes',
			args: [
				BigInt(roundId),
				CLAIM_START_INDEX,
				CLAIM_MAX_RANGES,
				userToClaim,
			],
		})

		return await this.sendKeeperTransaction(data)
	}

	async refund(roundId: number, userToRefund: Address): Promise<Transaction> {
		const data = encodeFunctionData({
			abi: ripsAbi,
			functionName: 'refund',
			args: [BigInt(roundId), userToRefund],
		})

		return await this.sendKeeperTransaction(data)
	}

	async requestVrf(roundId: number): Promise<Transaction> {
		const data = encodeFunctionData({
			abi: ripsAbi,
			functionName: 'requestRandomness',
			args: [BigInt(roundId)],
		})

		return await this.sendKeeperTransaction(data)
	}

	private async sendKeeperTransaction(data: Hex): Promise<Transaction> {
		if (!(this.mainCurrency instanceof EvmCurrency)) {
			throw new Error(`Unsupported currency: ${this.mainCurrency.id}`)
		}

		const chainId = Number(this.mainCurrency.chainAddress.chain.reference)
		const account = privateKeyToAccount(this.keeperPk)
		const client = this.evmClientService.getClient(chainId)

		const request: TransactionRequestEIP1559 = {
			to: this.contractAddress,
			data,
		}

		const tx = await client
			.prepareTransactionRequest({
				...request,
				account: account.address,
				chainId,
			})
			.catch((cause) => {
				throw new TransactionFailedError(
					'Transaction simulation failed',
					cause,
				)
			})

		const signedTx = await account.signTransaction(tx)

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
				currency: this.mainCurrency,
				amount: gasCost,
			},
		}
	}

	async buyTickets(
		wallet: Wallet,
		args: { stake: Stake; amount: number },
	): Promise<Purchase> {
		if (!(this.mainCurrency instanceof EvmCurrency)) {
			throw new Error(`Unsupported currency: ${this.mainCurrency.id}`)
		}

		const { stake, amount } = args

		const chainId = Number(this.mainCurrency.chainAddress.chain.reference)
		const userAddress = getAddress(wallet.namespaceToAddress[EIP155])
		const client = this.evmClientService.getClient(chainId)

		const totalValue = stake.ticketPrice.amount * BigInt(amount)

		const request: TransactionRequestEIP1559 = {
			to: this.contractAddress,
			data: encodeFunctionData({
				abi: ripsAbi,
				functionName: 'buyTickets',
				args: [BigInt(stake.id), BigInt(amount), userAddress],
			}),
			value: totalValue,
		}

		const tx = await client
			.prepareTransactionRequest({
				...request,
				account: userAddress,
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
				`TicketsPurchased event not found in transaction: ${txHash}`,
			)
		}

		const gasCost = receipt.gasUsed * receipt.effectiveGasPrice

		return {
			transaction: {
				id: txHash,
				cost: {
					currency: this.mainCurrency,
					amount: gasCost,
				},
			},
			ticketAmount: {
				roundId: Number(ticketsPurchasedLog.args.roundId),
				amount: Number(ticketsPurchasedLog.args.count),
			},
		}
	}
}
