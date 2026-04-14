import { Inject } from '@nestjs/common'
import ky from 'ky'
import {
	Address,
	encodeAbiParameters,
	encodeFunctionData,
	getAddress,
} from 'viem'
import { ZapService } from '../../application/interfaces/zap.service'
import { EIP155 } from '../../constants'
import { Config } from '../../domain/entities/config'
import { Currency } from '../../domain/entities/currency'
import { Transaction } from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'
import { wait } from '../../utils/common'
import { ripsAbi } from '../rips/rips-abi'
import { RIPS_SC_ADDRESS } from '../rips/rips.constants'
import { CreateTxSchema } from './schemas/create-tx.schema'
import { OrderSchema } from './schemas/order-status.schema'

const DEBRIDGE_API_URL = 'https://api.dln.trade/v1.0'
const UNIVERSAL_HOOK_ADDRESS = '0x0000000000000000000000000000000000000000'

export class DeBridgeService implements ZapService {
	constructor(
		@Inject(RIPS_SC_ADDRESS) private readonly ripsContractAddress: Address,
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

		const ticketCurrency = config.ticketPrice.currency
		const totalTicketAmount =
			config.ticketPrice.amount * BigInt(ticketCount)
		const userAddress = getAddress(wallet.namespaceToAddress[EIP155])

		const hookTo = getAddress(this.ripsContractAddress)
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
			[{ to: hookTo, txGas: 2_000_000n, callData: hookCalldata }],
		)

		const dlnHook = {
			type: 'evm_hook_data_v1',
			data: {
				fallbackAddress: userAddress,
				target: UNIVERSAL_HOOK_ADDRESS,
				reward: '0',
				isNonAtomic: false,
				isSuccessRequired: false,
				targetPayload,
			},
		}

		const data = await this.createTx({
			userAddress,
			srcCurrency: paymentCurrency,
			dstCurrency: ticketCurrency,
			exactOut: totalTicketAmount,
			dlnHook,
		})

		return BigInt(data.estimation.srcChainTokenIn.amount)
	}

	private async createTx(
		args: {
			userAddress: Address
			srcCurrency: Currency
			dstCurrency: Currency
			dlnHook?: unknown
		} & (
			| { exactIn: bigint; exactOut?: never }
			| { exactOut: bigint; exactIn?: never }
		),
	) {
		const { userAddress, srcCurrency, dstCurrency, dlnHook } = args

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
					dstChainTokenOutRecipient: userAddress,
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

	buyTickets(
		wallet: Wallet,
		args: {
			paymentCurrency: Currency
			stakeId: number
			config: Config
			ticketCount: number
		},
	): Promise<Transaction> {
		throw new Error('Method not implemented.')
	}
}
