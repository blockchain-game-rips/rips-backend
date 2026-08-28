import { Inject, Injectable, Logger } from '@nestjs/common'
import { Address, getAddress, hexToBigInt, isAddressEqual, isHex } from 'viem'
import { z } from 'zod'
import { Currency } from '../../../../domain/entities/currency'
import { CurrencyId } from '../../../../domain/value-objects/currency-id'
import { NATIVE_ADDRESS } from '../../primitives/currencies/constants'
import { ALCHEMY_API_KEY } from '../types'
import { getAlchemyNetwork, getAlchemyPortfolioUrl } from './alchemy-utils'

const REQUEST_TIMEOUT_MS = 8_000

export type AlchemyRawBalance = {
	tokenAddress: Address | null
	balance: bigint
}

export type AlchemyBalancesResult = {
	balancesByChainId: Map<number, AlchemyRawBalance[]>
	unsupportedChainIds: Set<number>
}

export type AlchemyCurrencyBalances = {
	balances: Map<CurrencyId, bigint>
	uncoveredCurrencies: Currency[]
}

const alchemyResponseSchema = z.object({
	data: z.object({
		tokens: z.array(
			z.object({
				network: z.string(),
				tokenAddress: z.string().nullable(),
				tokenBalance: z.string(),
			}),
		),
	}),
})

type AlchemyToken = z.infer<
	typeof alchemyResponseSchema
>['data']['tokens'][number]

@Injectable()
export class AlchemyBalanceService {
	private readonly logger = new Logger(AlchemyBalanceService.name)

	constructor(
		@Inject(ALCHEMY_API_KEY)
		private readonly apiKey: string | undefined,
	) {}

	async fetchBalances(
		address: Address,
		chainIds: number[],
	): Promise<AlchemyBalancesResult> {
		const { networkToChainId, unsupportedChainIds } =
			this.resolveNetworks(chainIds)

		if (networkToChainId.size === 0) {
			return { balancesByChainId: new Map(), unsupportedChainIds }
		}

		try {
			const tokens = await this.requestTokens(address, [
				...networkToChainId.keys(),
			])

			return {
				balancesByChainId: this.groupByChainId(
					tokens,
					networkToChainId,
				),
				unsupportedChainIds,
			}
		} catch (error) {
			this.logger.warn(
				`Alchemy balance fetch failed, falling back to RPC: ${String(error)}`,
			)

			for (const chainId of networkToChainId.values()) {
				unsupportedChainIds.add(chainId)
			}

			return { balancesByChainId: new Map(), unsupportedChainIds }
		}
	}

	async balancesFor(
		address: Address,
		currencies: Currency[],
	): Promise<AlchemyCurrencyBalances> {
		const chainIds = [
			...new Set(
				currencies.map((currency) =>
					Number(currency.chainAddress.chain.reference),
				),
			),
		].sort((a, b) => a - b)

		const { balancesByChainId, unsupportedChainIds } =
			await this.fetchBalances(address, chainIds)

		const balances = new Map<CurrencyId, bigint>()
		const uncoveredCurrencies: Currency[] = []

		for (const currency of currencies) {
			const chainId = Number(currency.chainAddress.chain.reference)

			if (unsupportedChainIds.has(chainId)) {
				uncoveredCurrencies.push(currency)
				continue
			}

			const chainBalances = balancesByChainId.get(chainId) ?? []
			const match = this.matchBalance(currency, chainBalances)

			balances.set(currency.id, match?.balance ?? 0n)
		}

		return { balances, uncoveredCurrencies }
	}

	private matchBalance(
		currency: Currency,
		balances: AlchemyRawBalance[],
	): AlchemyRawBalance | undefined {
		const currencyAddress = getAddress(currency.chainAddress.address)
		const isNative = isAddressEqual(currencyAddress, NATIVE_ADDRESS)

		return balances.find((balance) => {
			if (isNative) return balance.tokenAddress === null

			return (
				balance.tokenAddress !== null &&
				isAddressEqual(balance.tokenAddress, currencyAddress)
			)
		})
	}

	private resolveNetworks(chainIds: number[]): {
		networkToChainId: Map<string, number>
		unsupportedChainIds: Set<number>
	} {
		const networkToChainId = new Map<string, number>()
		const unsupportedChainIds = new Set<number>()

		for (const chainId of chainIds) {
			const network = getAlchemyNetwork(chainId)

			if (network) {
				networkToChainId.set(network, chainId)
			} else {
				unsupportedChainIds.add(chainId)
			}
		}

		return { networkToChainId, unsupportedChainIds }
	}

	private groupByChainId(
		tokens: AlchemyToken[],
		networkToChainId: Map<string, number>,
	): Map<number, AlchemyRawBalance[]> {
		const balancesByChainId = new Map<number, AlchemyRawBalance[]>()

		for (const token of tokens) {
			const chainId = networkToChainId.get(token.network)

			if (chainId === undefined) continue

			const chainBalances = balancesByChainId.get(chainId) ?? []

			chainBalances.push(this.toRawBalance(token))

			balancesByChainId.set(chainId, chainBalances)
		}

		return balancesByChainId
	}

	private toRawBalance(token: AlchemyToken): AlchemyRawBalance {
		return {
			tokenAddress:
				token.tokenAddress === null
					? null
					: getAddress(token.tokenAddress),
			balance: isHex(token.tokenBalance)
				? hexToBigInt(token.tokenBalance)
				: BigInt(token.tokenBalance),
		}
	}

	private async requestTokens(
		address: Address,
		networks: string[],
	): Promise<AlchemyToken[]> {
		if (this.apiKey === undefined) {
			throw new Error('ALCHEMY_API_KEY is not set')
		}

		const response = await fetch(getAlchemyPortfolioUrl(this.apiKey), {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				addresses: [{ address, networks }],
				includeNativeTokens: true,
				includeErc20Tokens: true,
				withMetadata: false,
				withPrices: false,
			}),
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		})

		if (!response.ok) {
			throw new Error(`Alchemy responded with status ${response.status}`)
		}

		const json: unknown = await response.json()

		return alchemyResponseSchema.parse(json).data.tokens
	}
}
