import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import ky from 'ky'
import { Address, getAddress, Hex, isAddressEqual } from 'viem'
import { Currency } from '../../domain/entities/currency'
import { withCache } from '../cache/with-cache'
import {
	LIFI_NATIVE_ADDRESS,
	NATIVE_ADDRESS,
} from '../evm/primitives/currencies/constants'
import { LIFI_API_KEY } from './li-fi.constants'
import { ContractCallsQuoteSchema } from './schemas/contract-calls.schema'

const LIFI_API_URL = 'https://li.quest/v1'
const API_KEY_HEADER = 'x-lifi-api-key'
const CONTRACT_CALLS_TTL_MS = 10000
const REQUEST_TIMEOUT_MS = 10000

/**
 * LI.FI intermittently fails to route a request it serves moments later,
 * answering 404. Quoting is read-only, so every failure is safe to retry.
 * ky retries neither POST nor 404 by default, so both are opted into here.
 */
const RETRY_LIMIT = 3
const RETRY_METHODS = ['post']
const RETRY_STATUS_CODES = [404, 408, 413, 429, 500, 502, 503, 504]

export type ContractCallsQuoteArgs = {
	userAddress: Address
	currencyIn: Currency
	currencyOut: Currency
	amountOut: bigint
	slippage: number
	call: {
		targetAddress: Address
		callData: Hex
		gasLimit: bigint
	}
}

@Injectable()
export class LiFiApiService {
	constructor(
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		@Inject(LIFI_API_KEY) private readonly apiKey: string | null,
	) {}

	async fetchContractCallsQuote(args: ContractCallsQuoteArgs) {
		const {
			userAddress,
			currencyIn,
			currencyOut,
			amountOut,
			slippage,
			call,
		} = args

		const cacheKey = [
			'lifi-contract-calls',
			userAddress,
			currencyIn.chainAddress.chain.reference,
			currencyIn.chainAddress.address,
			currencyOut.chainAddress.chain.reference,
			currencyOut.chainAddress.address,
			amountOut.toString(),
			slippage.toString(),
			call.targetAddress,
			call.callData,
			call.gasLimit.toString(),
		].join('-')

		return withCache(
			this.cacheManager,
			cacheKey,
			CONTRACT_CALLS_TTL_MS,
			() => this.doFetchContractCallsQuote(args),
		)
	}

	private async doFetchContractCallsQuote(args: ContractCallsQuoteArgs) {
		const {
			userAddress,
			currencyIn,
			currencyOut,
			amountOut,
			slippage,
			call,
		} = args

		const amountOutValue = amountOut.toString()
		const toToken = this.toLiFiAddress(currencyOut)

		const rawData = await ky
			.post(`${LIFI_API_URL}/quote/contractCalls`, {
				timeout: REQUEST_TIMEOUT_MS,
				retry: {
					limit: RETRY_LIMIT,
					methods: RETRY_METHODS,
					statusCodes: RETRY_STATUS_CODES,
				},
				headers: this.buildHeaders(),
				json: {
					fromChain: Number(currencyIn.chainAddress.chain.reference),
					fromToken: this.toLiFiAddress(currencyIn),
					fromAddress: userAddress,
					toChain: Number(currencyOut.chainAddress.chain.reference),
					toToken,
					toAmount: amountOutValue,
					slippage,
					contractCalls: [
						{
							fromAmount: amountOutValue,
							fromTokenAddress: toToken,
							toContractAddress: call.targetAddress,
							toContractCallData: call.callData,
							toContractGasLimit: call.gasLimit.toString(),
						},
					],
				},
			})
			.json()

		return ContractCallsQuoteSchema.parse(rawData)
	}

	private toLiFiAddress(currency: Currency): string {
		const { address } = currency.chainAddress

		return isAddressEqual(getAddress(address), NATIVE_ADDRESS)
			? LIFI_NATIVE_ADDRESS
			: address
	}

	private buildHeaders(): Record<string, string> {
		return this.apiKey ? { [API_KEY_HEADER]: this.apiKey } : {}
	}
}
