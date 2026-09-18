import { Injectable } from '@nestjs/common'
import ky, { HTTPError } from 'ky'
import { Address } from 'viem'
import { chainIdToGeckoChainId } from './constants'

export interface GeckoTerminalTokenData {
	id: string
	type: string
	attributes: {
		address: Address
		name: string
		symbol: string
		decimals: number
		image_url: string
		coingecko_coin_id: string
		total_supply: string
		price_usd: string
		fdv_usd: string
		total_reserve_in_usd: string
		volume_usd: {
			h24: string
		}
		market_cap_usd: string
	}
}

interface GeckoTerminalChain {
	id: string
	type: string
	attributes: {
		name: string
	}
}

// docs say that you can retrieve up to 30 addresses in one request
const BATCH_SIZE = 30

const REQUEST_TIMEOUT_MS = 20_000

@Injectable()
export class GeckoTerminalService {
	private readonly client = ky.create({
		prefixUrl: 'https://api.geckoterminal.com/api/v2',
		timeout: REQUEST_TIMEOUT_MS,
	})

	async getTokenData(
		address: string,
		network: string,
	): Promise<GeckoTerminalTokenData> {
		this.validateChain(network)

		const { data } = await this.client
			.get(`networks/${network}/tokens/${address}`)
			.json<{ data: GeckoTerminalTokenData }>()

		return data
	}

	async getTokenPrice(address: string, network: string): Promise<number> {
		this.validateChain(network)

		const tokenData = await this.getTokenData(address, network)
		return Number(tokenData.attributes.price_usd)
	}

	async getTokensData(
		addresses: string[],
		network: string,
	): Promise<GeckoTerminalTokenData[]> {
		this.validateChain(network)

		const allTokens: GeckoTerminalTokenData[] = []

		for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
			const batch = addresses.slice(i, i + BATCH_SIZE)
			const addressesString = batch.join(',')

			const { data } = await this.client
				.get(`networks/${network}/tokens/multi/${addressesString}`)
				.json<{ data: GeckoTerminalTokenData[] }>()

			allTokens.push(...data)
		}

		return allTokens
	}

	async getTokenPrices(
		addresses: string[],
		network: string,
	): Promise<{ address: string; price: number }[]> {
		const tokens = await this.getTokensData(addresses, network)

		return tokens.map((token) => ({
			address: token.attributes.address,
			price: Number(token.attributes.price_usd),
		}))
	}

	validateChain(chain: string) {
		const isSupported = Object.values(chainIdToGeckoChainId).includes(chain)

		if (!isSupported) throw new Error(`Chain ${chain} not found`)
	}

	async getNetworks(): Promise<GeckoTerminalChain[]> {
		const networks: GeckoTerminalChain[] = []

		let page = 1

		while (true) {
			try {
				const { data } = await this.client
					.get('networks', { searchParams: { page } })
					.json<{ data: GeckoTerminalChain[] }>()

				networks.push(...data)
				page++
			} catch (error) {
				if (
					error instanceof HTTPError &&
					error.response.status === 404 &&
					page !== 1
				)
					break

				throw error
			}
		}

		return networks
	}
}
