import { Inject, Injectable } from '@nestjs/common'
import ky from 'ky'
import {
	Address,
	encodeAbiParameters,
	encodeFunctionData,
	getAddress,
	Hex,
	maxUint256,
	TransactionRequestEIP1559,
} from 'viem'
import { ZapService } from '../../application/interfaces/zap.service'
import { Config } from '../../domain/entities/config'
import { Currency } from '../../domain/entities/currency'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { Purchase } from '../../domain/value-objects/purchase'
import { Transaction } from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'
import {
	PendingZap,
	ZapBuyResult,
	ZapSwapResult,
} from '../../domain/value-objects/zap'
import { wait } from '../../utils/common'
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
import { CreateTxResponse, CreateTxSchema } from './schemas/create-tx.schema'
import { OrderSchema } from './schemas/order-status.schema'

const DEBRIDGE_API_URL = 'https://api.dln.trade/v1.0'
const UNIVERSAL_HOOK_ADDRESS = '0x0000000000000000000000000000000000000000'

@Injectable()
export class DeBridgeService implements ZapService {
	constructor(
		@Inject(RIPS_SC_ADDRESS) private readonly ripsContractAddress: Address,
		private readonly evmClientService: EvmClientService,
		private readonly evmCurrencyService: EvmCurrencyService,
		private readonly evmCurrencyReadService: EvmCurrencyReadService,
		private readonly evmCurrencyWriteService: EvmCurrencyWriteService,
		private readonly evmTransactionService: EvmTransactionService,
	) {}

	async quote(
		wallet: Wallet,
		args: {
			stakeId: number
			config: Config
			paymentCurrency: Currency
			ticketCount: number
		},
	): Promise<bigint> {
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

		return amountIn
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

		const spender = await this.approveIfNeeded({
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

	swap(
		wallet: Wallet,
		args: {
			currencyIn: Currency
			currencyOut: Currency
			amountIn: bigint
			recipient: ChainAddress
		},
	): Promise<PendingZap> {
		// TODO: implement swap
		throw new Error('Not implemented')
	}

	waitForSwap(pendingZap: PendingZap): Promise<ZapSwapResult> {
		// TODO: implement waitForSwap
		throw new Error('Not implemented')
	}

	waitForBuyTickets(pendingZap: PendingZap): Promise<ZapBuyResult> {
		// TODO: implement waitForBuyTickets
		throw new Error('Not implemented')
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

		const createTxResponse = await this.fetchCreateTx({
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
					txGas: 2_000_000n,
					callData: hookCalldata,
				},
			],
		)

		return targetPayload
	}

	private async fetchCreateTx(
		args: {
			userAddress: Address
			recipient: Address
			srcCurrency: Currency
			dstCurrency: Currency
			dlnHook?: unknown
		} & (
			| { exactIn: bigint; exactOut?: never }
			| { exactOut: bigint; exactIn?: never }
		),
	) {
		const { userAddress, recipient, srcCurrency, dstCurrency, dlnHook } =
			args

		const amountParams =
			args.exactOut !== undefined
				? {
						srcChainTokenInAmount: 'auto',
						dstChainTokenOutAmount: args.exactOut.toString(),
					}
				: {
						srcChainTokenInAmount: args.exactIn.toString(),
						dstChainTokenOutAmount: 'auto',
					}

		const rawData = await ky
			.get(`${DEBRIDGE_API_URL}/dln/order/create-tx`, {
				timeout: 30000,
				retry: 0,
				searchParams: {
					senderAddress: userAddress,
					srcChainId: srcCurrency.chainAddress.chain.reference,
					srcChainTokenIn: srcCurrency.chainAddress.address,
					srcChainOrderAuthorityAddress: userAddress,
					dstChainId: dstCurrency.chainAddress.chain.reference,
					dstChainTokenOut: dstCurrency.chainAddress.address,
					dstChainTokenOutRecipient: recipient,
					dstChainOrderAuthorityAddress: userAddress,
					...amountParams,
					...(dlnHook !== undefined && {
						dlnHook: JSON.stringify(dlnHook),
					}),
				},
			})
			.json()

		return CreateTxSchema.parse(rawData)
	}

	async waitForOrderFulfillment(orderId: string) {
		const POLL_INTERVAL_MS = 2_000
		const FULFILLED_STATES = new Set([
			'Fulfilled',
			'SentUnlock',
			'ClaimedUnlock',
		])
		const CANCELLED_STATES = new Set([
			'SentOrderCancel',
			'OrderCancelled',
			'ClaimedOrderCancel',
		])

		while (true) {
			const order = await this.getOrder(orderId)

			if (FULFILLED_STATES.has(order.state)) {
				return order
			}

			if (CANCELLED_STATES.has(order.state)) {
				throw new Error(
					`Order ${orderId} was cancelled (state: ${order.state})`,
				)
			}

			await wait(POLL_INTERVAL_MS)
		}
	}

	async getOrder(orderId: string) {
		const rawData = await ky
			.get(`https://dln-api.debridge.finance/api/Orders/${orderId}`, {
				timeout: 30000,
				retry: 0,
			})
			.json()

		return OrderSchema.parse(rawData)
	}

	async getFulfilledOrderResult(
		dstTxHash: `0x${string}`,
		dstChainId: number,
	): Promise<
		| { status: 'success'; purchase: Purchase }
		| { status: 'hook_failed'; transaction: Transaction }
	> {
		const client = this.evmClientService.getClient(dstChainId)
		const nativeCurrency = this.evmCurrencyService.getNative(dstChainId)

		const receipt = await client.getTransactionReceipt({ hash: dstTxHash })

		const FULFILLED_ORDER_TOPIC =
			'0xc164aca37b9805a1c9027b6f32260a069723a82926f6e9ece4926e4dd3ea8ecf'

		const fulfilledOrderLog = receipt.logs.find(
			(log) => log.topics[0] === FULFILLED_ORDER_TOPIC,
		)

		if (!fulfilledOrderLog) {
			throw new Error(`No FulfilledOrder event found in tx ${dstTxHash}`)
		}

		const gasCost = receipt.gasUsed * receipt.effectiveGasPrice

		const transaction: Transaction = {
			id: dstTxHash,
			cost: { currency: nativeCurrency, amount: gasCost },
		}

		const purchase = parsePurchase(receipt, this.ripsContractAddress)

		if (!purchase) {
			return { status: 'hook_failed', transaction }
		}

		return { status: 'success', purchase }
	}
}
