import { Inject, Injectable } from '@nestjs/common'
import {
	Address,
	decodeEventLog,
	encodeAbiParameters,
	encodeFunctionData,
	getAddress,
	Hex,
	TransactionReceipt,
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
import { NOT_SENT } from '../../domain/value-objects/transaction-attempt'
import { toTransactionHash } from '../../domain/value-objects/transaction-hash'
import { Wallet } from '../../domain/value-objects/wallet'
import {
	CrosschainEnterStartResult,
	CrosschainSwapStartResult,
	CrosschainZapStartResult,
	SamechainSwapQuoteResult,
	SamechainSwapResult,
	ZapBuyResult,
	ZapQuoteEnterResult,
	ZapQuoteSwapResult,
	ZapSwapResult,
} from '../../domain/value-objects/zap'
import { EvmClientService } from '../evm/evm-client/evm-client.service'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { EvmTransactionService } from '../evm/evm-transaction.service'
import { TokenApprovalService } from '../evm/token-approval.service'
import { TransactionFeeService } from '../evm/transaction-fee.service'
import { toUnsuccessfulAttempt } from '../evm/utils/to-transaction-attempt'
import { parsePurchase } from '../rips/parse-purchase'
import { ripsConduitAbi } from '../rips/rips-conduit-abi'
import { RIPS_CONDUIT_CONTRACT, RIPS_CONTRACT } from '../rips/rips.constants'
import { fulfilledOrderAbi } from './abi'
import { DeBridgeApiService } from './de-bridge-api.service'
import { CreateTxResponse } from './schemas/create-tx.schema'
import { Order } from './schemas/order-status.schema'

type DstReceipt = {
	receipt: TransactionReceipt
	chainId: number
}

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
	private readonly ripsConduitContractAddress: EvmAddress

	constructor(
		@Inject(RIPS_CONTRACT) ripsContract: ChainAddress,
		@Inject(RIPS_CONDUIT_CONTRACT) ripsConduitContract: ChainAddress,
		private readonly evmClientService: EvmClientService,
		private readonly evmCurrencyService: EvmCurrencyService,
		private readonly evmTransactionService: EvmTransactionService,
		private readonly tokenApprovalService: TokenApprovalService,
		private readonly deBridgeApiService: DeBridgeApiService,
		private readonly transactionFeeService: TransactionFeeService,
	) {
		this.ripsContractAddress = toEvmAddress(ripsContract.address)
		this.ripsConduitContractAddress = toEvmAddress(
			ripsConduitContract.address,
		)
	}

	async getBuyResult(zapId: string): Promise<ZapBuyResult | null> {
		const resolved = await this.resolveOrderReceipt(zapId)

		if (resolved === null || resolved === 'cancelled') {
			return resolved === 'cancelled' ? { status: 'cancelled' } : null
		}

		const { receipt, chainId, orderId } = resolved
		const purchase = parsePurchase(receipt, this.ripsContractAddress)

		if (purchase !== null) {
			return {
				status: 'success',
				result: purchase,
				dstTransaction: this.evmCurrencyService.toTransaction(
					receipt,
					chainId,
				),
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

		const { receipt, chainId, orderId } = resolved
		const amountOut = await this.parseCurrencyAmountOut(receipt, orderId)

		return {
			status: 'success',
			result: { amountOut },
			dstTransaction: this.evmCurrencyService.toTransaction(
				receipt,
				chainId,
			),
		}
	}

	private async resolveOrderReceipt(
		zapId: string,
	): Promise<(DstReceipt & { orderId: string }) | 'cancelled' | null> {
		const order = await this.deBridgeApiService.getOrder(zapId)

		if (FULFILLED_STATES.has(order.state)) {
			const { receipt, chainId } = await this.getDstReceipt(order, zapId)
			return { receipt, chainId, orderId: zapId }
		}

		if (CANCELLED_STATES.has(order.state)) {
			return 'cancelled'
		}

		return null
	}

	private async getDstReceipt(
		order: Order,
		orderId: string,
	): Promise<DstReceipt> {
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

		const chainId = Number(dstChainId)

		const receipt = await this.evmClientService
			.getClient(chainId)
			.getTransactionReceipt({ hash: toTransactionHash(dstTxHash) })

		return { receipt, chainId }
	}

	private async parseCurrencyAmountOut(
		receipt: TransactionReceipt,
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
	): Promise<CrosschainEnterStartResult> {
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

		const gasLimit = BigInt(
			swapResponse.estimatedTransactionFee.details.gasLimit,
		)

		return {
			amountOut: {
				currency: currencyOut,
				amount: BigInt(swapResponse.tokenOut.amount),
			},
			transactionQuote: {
				blockchainFee: await this.transactionFeeService.estimateFee(
					gasLimit,
					chainId,
				),
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

		const approval = await this.tokenApprovalService.approveIfNeeded({
			wallet,
			currency: currencyIn,
			amount: amountIn,
			spender: getAddress(swapResponse.tx.to),
			owner: userAddress,
		})

		if (approval && approval.status !== 'succeeded') {
			return { approval, swap: NOT_SENT }
		}

		const txRequest: TransactionRequestEIP1559 = {
			to: swapResponse.tx.to,
			data: swapResponse.tx.data,
			value: BigInt(swapResponse.tx.value),
		}

		const result = await this.evmTransactionService.sendTransaction(
			wallet,
			txRequest,
			chainId,
		)

		if (result.status !== 'succeeded') {
			return { approval, swap: toUnsuccessfulAttempt(result) }
		}

		return {
			approval,
			swap: {
				status: 'succeeded',
				transaction: result.transaction,
				result: {
					amountOut: {
						currency: currencyOut,
						amount: BigInt(swapResponse.tokenOut.amount),
					},
				},
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
	): Promise<CrosschainSwapStartResult> {
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
	): Promise<CrosschainZapStartResult> {
		const userAddress = evmAddressFromWallet(wallet)
		const srcChainId = evmChainIdFromCurrency(currencyIn)
		const amountIn = BigInt(
			createTxResponse.estimation.srcChainTokenIn.amount,
		)

		const approval = await this.tokenApprovalService.approveIfNeeded({
			wallet,
			currency: currencyIn,
			amount: amountIn,
			spender: getAddress(createTxResponse.tx.to),
			owner: userAddress,
		})

		if (approval && approval.status !== 'succeeded') {
			return { approval, zap: NOT_SENT }
		}

		const result = await this.evmTransactionService.sendTransaction(
			wallet,
			this.txRequestFromCreateTxResponse(createTxResponse),
			srcChainId,
		)

		if (result.status !== 'succeeded') {
			return { approval, zap: toUnsuccessfulAttempt(result) }
		}

		return {
			approval,
			zap: {
				status: 'succeeded',
				transaction: result.transaction,
				result: {
					zapId: createTxResponse.orderId,
					amountIn: { currency: currencyIn, amount: amountIn },
					...this.durationAndFeeFromCreateTxResponse(
						createTxResponse,
					),
				},
			},
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

		const gasLimit = BigInt(
			createTxResponse.estimatedTransactionFee.details.gasLimit,
		)

		return {
			blockchainFee: await this.transactionFeeService.estimateFee(
				gasLimit,
				srcChainId,
			),
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
			abi: ripsConduitAbi,
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
					to: this.ripsConduitContractAddress,
					txGas: DEFAULT_GAS_LIMIT,
					callData: hookCalldata,
				},
			],
		)

		return targetPayload
	}
}
