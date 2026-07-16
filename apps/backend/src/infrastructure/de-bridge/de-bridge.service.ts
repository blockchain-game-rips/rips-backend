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
import { Config } from '../../domain/entities/config'
import { Currency } from '../../domain/entities/currency'
import {
	evmAddressFromWallet,
	evmChainIdFromCurrency,
} from '../../domain/services/evm'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import {
	EvmAddress,
	toEvmAddress,
} from '../../domain/value-objects/evm-address'
import { Wallet } from '../../domain/value-objects/wallet'
import {
	PendingZap,
	SamechainSwapQuoteResult,
	SamechainSwapResult,
	ZapBuyResult,
	ZapQuoteEnterResult,
	ZapQuoteSwapResult,
	ZapSwapResult,
} from '../../domain/value-objects/zap'
import { EvmClientService } from '../evm/evm-client/evm-client.service'
import { EvmCurrencyReadService } from '../evm/evm-currency-read.service'
import { EvmCurrencyWriteService } from '../evm/evm-currency-write.service'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { EvmTransactionService } from '../evm/evm-transaction.service'
import { GasPriceService } from '../evm/gas-price.service'
import { Token } from '../evm/primitives/currencies/token'
import { parsePurchase } from '../rips/parse-purchase'
import { ripsAbi } from '../rips/rips-abi'
import { RIPS_CONTRACT } from '../rips/rips.constants'
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
export class DeBridgeService {
	private readonly ripsContractAddress: EvmAddress

	constructor(
		@Inject(RIPS_CONTRACT) ripsContract: ChainAddress,
		private readonly evmClientService: EvmClientService,
		private readonly evmCurrencyService: EvmCurrencyService,
		private readonly evmCurrencyReadService: EvmCurrencyReadService,
		private readonly evmCurrencyWriteService: EvmCurrencyWriteService,
		private readonly evmTransactionService: EvmTransactionService,
		private readonly deBridgeApiService: DeBridgeApiService,
		private readonly gasPriceService: GasPriceService,
	) {
		this.ripsContractAddress = toEvmAddress(ripsContract.address)
	}

	async getBuyResult(zapId: string): Promise<ZapBuyResult | null> {
		const resolved = await this.resolveOrderReceipt(zapId)

		if (resolved === null || resolved === 'cancelled') {
			return resolved === 'cancelled' ? { status: 'cancelled' } : null
		}

		const { receipt, orderId } = resolved
		const purchase = parsePurchase(receipt, this.ripsContractAddress)

		if (purchase !== null) {
			return {
				status: 'success',
				result: purchase,
				dstTransaction: { id: receipt.transactionHash },
			}
		}

		const refund = await this.parseCurrencyAmountOut(receipt, orderId)

		return { status: 'failed', refund }
	}

	async getSwapResult(zapId: string): Promise<ZapSwapResult | null> {
		const resolved = await this.resolveOrderReceipt(zapId)

		if (resolved === null || resolved === 'cancelled') {
			return resolved === 'cancelled' ? { status: 'cancelled' } : null
		}

		const { receipt, orderId } = resolved
		const amountOut = await this.parseCurrencyAmountOut(receipt, orderId)

		return {
			status: 'success',
			result: { amountOut },
			dstTransaction: { id: receipt.transactionHash },
		}
	}

	private async resolveOrderReceipt(zapId: string): Promise<
		| {
				receipt: Awaited<ReturnType<typeof this.getDstReceipt>>
				orderId: string
		  }
		| 'cancelled'
		| null
	> {
		const order = await this.deBridgeApiService.getOrder(zapId)

		if (FULFILLED_STATES.has(order.state)) {
			const receipt = await this.getDstReceipt(order, zapId)
			return { receipt, orderId: zapId }
		}

		if (CANCELLED_STATES.has(order.state)) {
			return 'cancelled'
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

	async quoteSwapCrosschain(
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
			amountOut: {
				currency: currencyOut,
				amount: BigInt(
					createTxResponse.estimation.dstChainTokenOut.amount,
				),
			},
			...this.durationAndFeeFromCreateTxResponse(createTxResponse),
			transactionQuote:
				await this.blockchainFeeFromCreateTxResponse(createTxResponse),
		}
	}

	async quoteEnterCrosschain(
		wallet: Wallet,
		args: {
			presetId: number
			config: Config
			paymentCurrency: Currency
			entryCount: number
		},
	): Promise<ZapQuoteEnterResult> {
		const { config, paymentCurrency, entryCount, presetId } = args
		const userAddress = evmAddressFromWallet(wallet)

		const createTxResponse = await this.fetchCreateTxForBuyEntries({
			userAddress,
			presetId,
			entryCount,
			config,
			paymentCurrency,
		})

		const amountIn = BigInt(
			createTxResponse.estimation.srcChainTokenIn.amount,
		)

		return {
			amountIn: {
				amount: amountIn,
				currency: paymentCurrency,
			},
			...this.durationAndFeeFromCreateTxResponse(createTxResponse),
			transactionQuote:
				await this.blockchainFeeFromCreateTxResponse(createTxResponse),
		}
	}

	async enterCrosschain(
		wallet: Wallet,
		args: {
			paymentCurrency: Currency
			presetId: number
			config: Config
			entryCount: number
		},
	): Promise<PendingZap> {
		const { config, paymentCurrency, entryCount, presetId } = args
		const userAddress = evmAddressFromWallet(wallet)

		const createTxResponse = await this.fetchCreateTxForBuyEntries({
			userAddress,
			presetId,
			entryCount,
			config,
			paymentCurrency,
		})

		return this.sendZap(wallet, createTxResponse, paymentCurrency)
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

	async quoteSwapSamechain(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<SamechainSwapQuoteResult> {
		const { currencyIn, currencyOut, amountIn, recipient } = args
		const userAddress = evmAddressFromWallet(wallet)
		const chainId = evmChainIdFromCurrency(currencyIn)

		const swapResponse = await this.deBridgeApiService.fetchSameChainSwapTx(
			{
				chainId,
				userAddress,
				srcCurrency: currencyIn,
				dstCurrency: currencyOut,
				amountIn,
				recipient: getAddress(recipient.address),
			},
		)

		const nativeCurrency = this.evmCurrencyService.getNative(chainId)
		const gasLimit = BigInt(
			swapResponse.estimatedTransactionFee.details.gasLimit,
		)
		const gasPrice = await this.gasPriceService.getGasPrice(chainId)

		return {
			amountOut: {
				currency: currencyOut,
				amount: BigInt(swapResponse.tokenOut.amount),
			},
			transactionQuote: {
				blockchainFee: {
					currency: nativeCurrency,
					amount: gasLimit * gasPrice,
				},
			},
		}
	}

	async swapSamechain(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<SamechainSwapResult> {
		const { currencyIn, currencyOut, amountIn, recipient } = args
		const userAddress = evmAddressFromWallet(wallet)
		const chainId = evmChainIdFromCurrency(currencyIn)

		const swapResponse = await this.deBridgeApiService.fetchSameChainSwapTx(
			{
				chainId,
				userAddress,
				srcCurrency: currencyIn,
				dstCurrency: currencyOut,
				amountIn,
				recipient: getAddress(recipient.address),
			},
		)

		await this.approveIfNeeded({
			wallet,
			paymentCurrency: currencyIn,
			amountIn,
			spender: getAddress(swapResponse.tx.to),
			userAddress,
		})

		const txRequest: TransactionRequestEIP1559 = {
			to: swapResponse.tx.to,
			data: swapResponse.tx.data,
			value: BigInt(swapResponse.tx.value),
		}

		const { transaction } =
			await this.evmTransactionService.sendTransaction(
				wallet,
				txRequest,
				chainId,
			)

		return {
			transaction,
			amountOut: {
				currency: currencyOut,
				amount: BigInt(swapResponse.tokenOut.amount),
			},
		}
	}

	async swapCrosschain(
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

		const createTxResponse = await this.deBridgeApiService.fetchCreateTx({
			userAddress,
			recipient: getAddress(recipient.address),
			srcCurrency: currencyIn,
			dstCurrency: currencyOut,
			exactIn: amountIn,
		})

		return this.sendZap(wallet, createTxResponse, currencyIn)
	}

	private async sendZap(
		wallet: Wallet,
		createTxResponse: CreateTxResponse,
		currencyIn: Currency,
	): Promise<PendingZap> {
		const userAddress = evmAddressFromWallet(wallet)
		const srcChainId = evmChainIdFromCurrency(currencyIn)
		const amountIn = BigInt(
			createTxResponse.estimation.srcChainTokenIn.amount,
		)

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
				this.txRequestFromCreateTxResponse(createTxResponse),
				srcChainId,
			)

		return {
			srcTransaction: transaction,
			zapId: createTxResponse.orderId,
			amountIn: { currency: currencyIn, amount: amountIn },
			...this.durationAndFeeFromCreateTxResponse(createTxResponse),
		}
	}

	durationAndFeeFromCreateTxResponse(createTxResponse: CreateTxResponse) {
		const nativeCurrency = this.evmCurrencyService.getNative(
			createTxResponse.estimation.srcChainTokenIn.chainId,
		)

		return {
			durationMs:
				createTxResponse.order.approximateFulfillmentDelay * 1000,
			fee: {
				currency: nativeCurrency,
				amount: BigInt(createTxResponse.fixFee),
			},
		}
	}

	private async blockchainFeeFromCreateTxResponse(
		createTxResponse: CreateTxResponse,
	) {
		const srcChainId = createTxResponse.estimation.srcChainTokenIn.chainId
		const nativeCurrency = this.evmCurrencyService.getNative(srcChainId)

		const gasLimit = BigInt(
			createTxResponse.estimatedTransactionFee.details.gasLimit,
		)
		const gasPrice = await this.gasPriceService.getGasPrice(srcChainId)

		return {
			blockchainFee: {
				currency: nativeCurrency,
				amount: gasLimit * gasPrice,
			},
		}
	}

	private txRequestFromCreateTxResponse(
		createTxResponse: CreateTxResponse,
	): TransactionRequestEIP1559 {
		return {
			to: createTxResponse.tx.to,
			data: createTxResponse.tx.data,
			value: BigInt(createTxResponse.tx.value),
		}
	}

	private async fetchCreateTxForBuyEntries(args: {
		userAddress: Address
		presetId: number
		entryCount: number
		config: Config
		paymentCurrency: Currency
	}): Promise<CreateTxResponse> {
		const { userAddress, presetId, entryCount, config, paymentCurrency } =
			args

		const entryCurrency = config.entryPrice.currency
		const paymentAmount = config.entryPrice.amount * BigInt(entryCount)

		const payload = this.buildBuyEntriesPayload({
			presetId: BigInt(presetId),
			entryCount: BigInt(entryCount),
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

		return this.deBridgeApiService.fetchCreateTx({
			userAddress,
			recipient: userAddress,
			srcCurrency: paymentCurrency,
			dstCurrency: entryCurrency,
			exactOut: paymentAmount,
			dlnHook,
		})
	}

	private buildBuyEntriesPayload(args: {
		presetId: bigint
		entryCount: bigint
		userAddress: Address
	}): Hex {
		const { presetId, entryCount, userAddress } = args

		const hookCalldata = encodeFunctionData({
			abi: ripsAbi,
			functionName: 'enterRip',
			args: [presetId, entryCount, userAddress],
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
