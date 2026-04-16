import { Inject, Injectable } from '@nestjs/common'
import {
	Address,
	decodeEventLog,
	encodeAbiParameters,
	encodeFunctionData,
	getAddress,
	Hash,
	Hex,
	maxUint256,
	TransactionRequestEIP1559,
} from 'viem'
import { ZapService } from '../../application/interfaces/zap.service'
import { Config } from '../../domain/entities/config'
import { Currency } from '../../domain/entities/currency'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { Wallet } from '../../domain/value-objects/wallet'
import {
	PendingZap,
	ZapBuyResult,
	ZapQuoteBuyResult,
	ZapQuoteSwapResult,
	ZapSwapResult,
} from '../../domain/value-objects/zap'
import { EvmClientService } from '../evm/evm-client/evm-client.service'
import { EvmCurrencyReadService } from '../evm/evm-currency-read.service'
import { EvmCurrencyWriteService } from '../evm/evm-currency-write.service'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { EvmTransactionService } from '../evm/evm-transaction.service'
import { evmAddressFromWallet, evmChainIdFromCurrency } from '../evm/helpers'
import { Token } from '../evm/primitives/currencies/token'
import { parsePurchase } from '../rips/parse-purchase'
import { ripsAbi } from '../rips/rips-abi'
import { RIPS_SC_ADDRESS } from '../rips/rips.constants'
import { fulfilledOrderAbi } from './abi'
import { DeBridgeApiService } from './de-bridge-api.service'
import { CreateTxResponse } from './schemas/create-tx.schema'
import { Order } from './schemas/order-status.schema'

const FULFILLED_STATES = new Set(['Fulfilled', 'SentUnlock', 'ClaimedUnlock'])
const CANCELLED_STATES = new Set([
	'SentOrderCancel',
	'OrderCancelled',
	'ClaimedOrderCancel',
])
const UNIVERSAL_HOOK_ADDRESS = '0x0000000000000000000000000000000000000000'
const DEFAULT_GAS_LIMIT = 2_000_000n

@Injectable()
export class DeBridgeService implements ZapService {
	constructor(
		@Inject(RIPS_SC_ADDRESS) private readonly ripsContractAddress: Address,
		private readonly evmClientService: EvmClientService,
		private readonly evmCurrencyService: EvmCurrencyService,
		private readonly evmCurrencyReadService: EvmCurrencyReadService,
		private readonly evmCurrencyWriteService: EvmCurrencyWriteService,
		private readonly evmTransactionService: EvmTransactionService,
		private readonly deBridgeApiService: DeBridgeApiService,
	) {}

	async getBuyResult(pendingZap: PendingZap): Promise<ZapBuyResult | null> {
		const orderId = pendingZap.zapId

		const order = await this.deBridgeApiService.getOrder(orderId)

		if (FULFILLED_STATES.has(order.state)) {
			const receipt = await this.getDstReceipt(order, orderId)

			const purchase = parsePurchase(receipt, this.ripsContractAddress)

			if (purchase !== null) {
				return {
					status: 'success',
					result: purchase,
					transaction: { id: receipt.transactionHash },
				}
			}

			const refund = await this.parseCurrencyAmountOut(receipt, orderId)

			return { status: 'failed', refund }
		}

		if (CANCELLED_STATES.has(order.state)) {
			return { status: 'cancelled' }
		}

		return null
	}

	async getSwapResult(pendingZap: PendingZap): Promise<ZapSwapResult | null> {
		const orderId = pendingZap.zapId

		const order = await this.deBridgeApiService.getOrder(orderId)

		if (FULFILLED_STATES.has(order.state)) {
			const receipt = await this.getDstReceipt(order, orderId)

			const amountOut = await this.parseCurrencyAmountOut(
				receipt,
				orderId,
			)

			return {
				status: 'success',
				result: { amountOut },
				transaction: { id: receipt.transactionHash },
			}
		}

		if (CANCELLED_STATES.has(order.state)) {
			return { status: 'cancelled' }
		}

		return null
	}

	private async getDstReceipt(order: Order, orderId: string) {
		const dstTxHash =
			order.fulfilledDstEventMetadata?.transactionHash.stringValue

		if (!dstTxHash) {
			throw new Error(
				`Order ${orderId} fulfilled but dst tx hash missing`,
			)
		}

		const dstChainId = order.takeOfferWithMetadata?.chainId.stringValue

		if (!dstChainId) {
			throw new Error(
				`Order ${orderId} fulfilled but dst chain id missing`,
			)
		}

		return this.evmClientService
			.getClient(Number(dstChainId))
			.getTransactionReceipt({ hash: dstTxHash as Hash })
	}

	private async parseCurrencyAmountOut(
		receipt: Awaited<ReturnType<typeof this.getDstReceipt>>,
		orderId: string,
	) {
		const fulfilledLog = receipt.logs
			.map((l) => {
				try {
					return decodeEventLog({
						abi: fulfilledOrderAbi,
						...l,
						strict: true,
					})
				} catch {
					return null
				}
			})
			.find((l) => l?.eventName === 'FulfilledOrder')

		if (!fulfilledLog) {
			throw new Error(
				`FulfilledOrder event not found in dst tx for order ${orderId}`,
			)
		}

		const { takeTokenAddress, takeChainId } = fulfilledLog.args.order
		const { actualFulfillAmount } = fulfilledLog.args

		const tokenAddress = getAddress(`0x${takeTokenAddress.slice(-40)}`)
		const currency = await this.evmCurrencyService.fromAddress(
			tokenAddress,
			Number(takeChainId),
		)

		return { currency, amount: actualFulfillAmount }
	}

	async quoteSwap(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<ZapQuoteSwapResult> {
		const { currencyIn, currencyOut, amountIn, recipient } = args
		const userAddress = evmAddressFromWallet(wallet)

		const createTxResponse = await this.deBridgeApiService.fetchCreateTx({
			userAddress,
			recipient: getAddress(recipient.address),
			srcCurrency: currencyIn,
			dstCurrency: currencyOut,
			exactIn: amountIn,
		})

		return {
			amountOut: BigInt(
				createTxResponse.estimation.dstChainTokenOut.amount,
			),
		}
	}

	async quoteBuyTickets(
		wallet: Wallet,
		args: {
			stakeId: number
			config: Config
			paymentCurrency: Currency
			ticketCount: number
		},
	): Promise<ZapQuoteBuyResult> {
		const { config, paymentCurrency, ticketCount, stakeId } = args
		const userAddress = evmAddressFromWallet(wallet)

		const createTxResponse = await this.fetchCreateTxForBuyTickets({
			userAddress,
			stakeId,
			ticketCount,
			config,
			paymentCurrency,
		})

		const amountIn = BigInt(
			createTxResponse.estimation.srcChainTokenIn.amount,
		)

		return { amountIn }
	}

	async buyTickets(
		wallet: Wallet,
		args: {
			paymentCurrency: Currency
			stakeId: number
			config: Config
			ticketCount: number
		},
	): Promise<PendingZap> {
		const { config, paymentCurrency, ticketCount, stakeId } = args

		const userAddress = evmAddressFromWallet(wallet)
		const srcChainId = evmChainIdFromCurrency(paymentCurrency)

		const createTxResponse = await this.fetchCreateTxForBuyTickets({
			userAddress,
			stakeId,
			ticketCount,
			config,
			paymentCurrency,
		})

		await this.approveIfNeeded({
			wallet,
			paymentCurrency,
			amountIn: BigInt(
				createTxResponse.estimation.srcChainTokenIn.amount,
			),
			spender: getAddress(createTxResponse.tx.to),
			userAddress,
		})

		const { transaction } =
			await this.evmTransactionService.sendTransaction(
				wallet,
				this.txRequestFromOrder(createTxResponse),
				srcChainId,
			)

		return { srcTransaction: transaction, zapId: createTxResponse.orderId }
	}

	async approveIfNeeded(args: {
		wallet: Wallet
		paymentCurrency: Currency
		amountIn: bigint
		spender: Address
		userAddress: Address
	}) {
		const { wallet, paymentCurrency, amountIn, spender, userAddress } = args

		if (paymentCurrency instanceof Token) {
			const allowance = await this.evmCurrencyReadService.allowance(
				paymentCurrency,
				userAddress,
				spender,
			)

			if (allowance < amountIn) {
				await this.evmCurrencyWriteService.approve(wallet, {
					token: paymentCurrency,
					spender,
					amount: maxUint256,
				})
			}
		}
	}

	async swap(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<PendingZap> {
		const { currencyIn, currencyOut, amountIn, recipient } = args
		const userAddress = evmAddressFromWallet(wallet)
		const srcChainId = evmChainIdFromCurrency(currencyIn)

		const createTxResponse = await this.deBridgeApiService.fetchCreateTx({
			userAddress,
			recipient: getAddress(recipient.address),
			srcCurrency: currencyIn,
			dstCurrency: currencyOut,
			exactIn: amountIn,
		})

		await this.approveIfNeeded({
			wallet,
			paymentCurrency: currencyIn,
			amountIn,
			spender: getAddress(createTxResponse.tx.to),
			userAddress,
		})

		const { transaction } =
			await this.evmTransactionService.sendTransaction(
				wallet,
				this.txRequestFromOrder(createTxResponse),
				srcChainId,
			)

		return { srcTransaction: transaction, zapId: createTxResponse.orderId }
	}

	private txRequestFromOrder(
		createTxResponse: CreateTxResponse,
	): TransactionRequestEIP1559 {
		return {
			to: createTxResponse.tx.to as Address,
			data: createTxResponse.tx.data as `0x${string}`,
			value: BigInt(createTxResponse.tx.value),
		}
	}

	private async fetchCreateTxForBuyTickets(args: {
		userAddress: Address
		stakeId: number
		ticketCount: number
		config: Config
		paymentCurrency: Currency
	}): Promise<CreateTxResponse> {
		const { userAddress, stakeId, ticketCount, config, paymentCurrency } =
			args

		const ticketCurrency = config.ticketPrice.currency
		const paymentAmount = config.ticketPrice.amount * BigInt(ticketCount)

		const payload = this.buildBuyTicketsPayload({
			stakeId: BigInt(stakeId),
			ticketCount: BigInt(ticketCount),
			userAddress,
		})

		const dlnHook = {
			type: 'evm_hook_data_v1',
			data: {
				fallbackAddress: userAddress,
				target: UNIVERSAL_HOOK_ADDRESS,
				reward: '0',
				isNonAtomic: false,
				isSuccessRequired: false,
				targetPayload: payload,
			},
		}

		const createTxResponse = await this.deBridgeApiService.fetchCreateTx({
			userAddress,
			recipient: userAddress,
			srcCurrency: paymentCurrency,
			dstCurrency: ticketCurrency,
			exactOut: paymentAmount,
			dlnHook,
		})

		return createTxResponse
	}

	private buildBuyTicketsPayload(args: {
		stakeId: bigint
		ticketCount: bigint
		userAddress: Address
	}): Hex {
		const { stakeId, ticketCount, userAddress } = args

		const hookCalldata = encodeFunctionData({
			abi: ripsAbi,
			functionName: 'buyTickets',
			args: [BigInt(stakeId), BigInt(ticketCount), userAddress],
		})

		const targetPayload = encodeAbiParameters(
			[
				{
					type: 'tuple',
					components: [
						{ name: 'to', type: 'address' },
						{ name: 'txGas', type: 'uint256' },
						{ name: 'callData', type: 'bytes' },
					],
				},
			],
			[
				{
					to: this.ripsContractAddress,
					txGas: DEFAULT_GAS_LIMIT,
					callData: hookCalldata,
				},
			],
		)

		return targetPayload
	}
}
