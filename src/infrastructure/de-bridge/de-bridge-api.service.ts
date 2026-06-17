import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, Logger } from '@nestjs/common'
import ky from 'ky'
import { Address } from 'viem'
import { Currency } from '../../domain/entities/currency'
import { withCache } from '../cache/with-cache'
import { CreateTxSchema } from './schemas/create-tx.schema'
import { OrderSchema } from './schemas/order-status.schema'
import { SameChainSwapSchema } from './schemas/same-chain-swap.schema'

const DEBRIDGE_DLN_API_URL = 'https://api.dln.trade/v1.0'
const DEBRIDGE_SWAP_API_URL = 'https://dln.debridge.finance/v1.0'
const CREATE_TX_TTL_MS = 10000
const SAME_CHAIN_SWAP_TTL_MS = 10000

@Injectable()
export class DeBridgeApiService {
	private readonly logger = new Logger(DeBridgeApiService.name)

	constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

	async getOrder(orderId: string) {
		const start = Date.now()

		try {
			const rawData = await ky
				.get(`https://dln-api.debridge.finance/api/Orders/${orderId}`, {
					timeout: 10000,
					retry: 0,
				})
				.json()

			this.logger.log(
				{ orderId, durationMs: Date.now() - start },
				'DeBridge getOrder succeeded',
			)

			return OrderSchema.parse(rawData)
		} catch (error) {
			this.logger.error(
				{ orderId, durationMs: Date.now() - start },
				'DeBridge getOrder failed',
			)

			throw error
		}
	}

	async fetchCreateTx(
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
		const { userAddress, srcCurrency, dstCurrency, dlnHook } = args

		const amountKey =
			args.exactOut !== undefined
				? `out-${args.exactOut}`
				: `in-${args.exactIn}`

		const hookKey = dlnHook !== undefined ? JSON.stringify(dlnHook) : ''

		const cacheKey = [
			'debridge-create-tx',
			userAddress,
			srcCurrency.chainAddress.chain.reference,
			srcCurrency.chainAddress.address,
			dstCurrency.chainAddress.chain.reference,
			dstCurrency.chainAddress.address,
			amountKey,
			hookKey,
		].join('-')

		return withCache(this.cacheManager, cacheKey, CREATE_TX_TTL_MS, () =>
			this.doFetchCreateTx(args),
		)
	}

	async fetchSameChainSwapTx(args: {
		chainId: number
		userAddress: Address
		srcCurrency: Currency
		dstCurrency: Currency
		amountIn: bigint
		recipient: Address
	}) {
		const {
			chainId,
			userAddress,
			srcCurrency,
			dstCurrency,
			amountIn,
			recipient,
		} = args

		const cacheKey = [
			'debridge-same-chain-swap',
			chainId,
			userAddress,
			srcCurrency.chainAddress.address,
			dstCurrency.chainAddress.address,
			amountIn.toString(),
			recipient,
		].join('-')

		return withCache(
			this.cacheManager,
			cacheKey,
			SAME_CHAIN_SWAP_TTL_MS,
			() => this.doFetchSameChainSwapTx(args),
		)
	}

	private async doFetchSameChainSwapTx(args: {
		chainId: number
		userAddress: Address
		srcCurrency: Currency
		dstCurrency: Currency
		amountIn: bigint
		recipient: Address
	}) {
		const {
			chainId,
			userAddress,
			srcCurrency,
			dstCurrency,
			amountIn,
			recipient,
		} = args

		const logContext = {
			chainId,
			userAddress,
			srcToken: srcCurrency.chainAddress.address,
			dstToken: dstCurrency.chainAddress.address,
		}

		const start = Date.now()

		try {
			const rawData = await ky
				.get(`${DEBRIDGE_SWAP_API_URL}/chain/transaction`, {
					timeout: 10000,
					retry: 0,
					searchParams: {
						chainId: chainId.toString(),
						tokenIn: srcCurrency.chainAddress.address,
						tokenInAmount: amountIn.toString(),
						tokenOut: dstCurrency.chainAddress.address,
						tokenOutRecipient: recipient,
						senderAddress: userAddress,
						slippage: 'auto',
					},
				})
				.json()

			this.logger.log(
				{ ...logContext, durationMs: Date.now() - start },
				'DeBridge fetchSameChainSwapTx succeeded',
			)

			return SameChainSwapSchema.parse(rawData)
		} catch (error) {
			this.logger.error(
				{ ...logContext, durationMs: Date.now() - start },
				'DeBridge fetchSameChainSwapTx failed',
			)

			throw error
		}
	}

	private async doFetchCreateTx(
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

		const logContext = {
			userAddress,
			srcChain: srcCurrency.chainAddress.chain.reference,
			srcToken: srcCurrency.chainAddress.address,
			dstChain: dstCurrency.chainAddress.chain.reference,
			dstToken: dstCurrency.chainAddress.address,
		}

		const start = Date.now()

		try {
			const rawData = await ky
				.get(`${DEBRIDGE_DLN_API_URL}/dln/order/create-tx`, {
					timeout: 10000,
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

			this.logger.log(
				{ ...logContext, durationMs: Date.now() - start },
				'DeBridge fetchCreateTx succeeded',
			)

			return CreateTxSchema.parse(rawData)
		} catch (error) {
			this.logger.error(
				{ ...logContext, durationMs: Date.now() - start },
				'DeBridge fetchCreateTx failed',
			)

			throw error
		}
	}
}
