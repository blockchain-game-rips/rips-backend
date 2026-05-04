import { Injectable, Logger } from '@nestjs/common'
import ky from 'ky'
import { Address } from 'viem'
import { Currency } from '../../domain/entities/currency'
import { CreateTxSchema } from './schemas/create-tx.schema'
import { OrderSchema } from './schemas/order-status.schema'

const DEBRIDGE_API_URL = 'https://api.dln.trade/v1.0'

@Injectable()
export class DeBridgeApiService {
	private readonly logger = new Logger(DeBridgeApiService.name)

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
