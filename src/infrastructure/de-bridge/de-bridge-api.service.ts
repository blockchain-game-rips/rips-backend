import { Injectable } from '@nestjs/common'
import ky from 'ky'
import { Address } from 'viem'
import { Currency } from '../../domain/entities/currency'
import { CreateTxSchema } from './schemas/create-tx.schema'
import { OrderSchema } from './schemas/order-status.schema'

const DEBRIDGE_API_URL = 'https://api.dln.trade/v1.0'

@Injectable()
export class DeBridgeApiService {
	async getOrder(orderId: string) {
		const rawData = await ky
			.get(`https://dln-api.debridge.finance/api/Orders/${orderId}`, {
				timeout: 10000,
				retry: 0,
			})
			.json()

		return OrderSchema.parse(rawData)
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
}
