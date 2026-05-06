import { Injectable } from '@nestjs/common'
import axios, { isAxiosError } from 'axios'
import { Address } from 'viem'
import { geckoTerminalChains } from './constants'

interface GeckoTerminalTokenData {
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

//TODO: handle 429 (maybe prefetch all currencies) and move from axios to ky
@Injectable()
export class GeckoTerminalService {
	private readonly baseUrl: string = 'https://api.geckoterminal.com/api/v2'

	async getTokenData(
		address: string,
		network: string,
	): Promise<GeckoTerminalTokenData> {
		this.validateChain(network)

		const tokenDataUrl = `${this.baseUrl}/networks/${network}/tokens/${address}`
		const { data } = await axios.get<{ data: GeckoTerminalTokenData }>(
			tokenDataUrl,
		)

		return data.data
	}

	async getTokenPrice(address: string, network: string): Promise<number> {
		this.validateChain(network)

		const tokenData = await this.getTokenData(address, network)
		return Number(tokenData.attributes.price_usd)
	}

	async getTokenPrices(
		addresses: string[],
		network: string,
	): Promise<{ address: string; price: number }[]> {
		this.validateChain(network)

		const allTokens: GeckoTerminalTokenData[] = []

		// Process addresses in batches of 30
		for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
			const batch = addresses.slice(i, i + BATCH_SIZE)
			const addressesString = batch.join(',')

			const tokensDataUrl = `${this.baseUrl}/networks/${network}/tokens/multi/${addressesString}`

			const { data } = await axios.get<{
				data: GeckoTerminalTokenData[]
			}>(tokensDataUrl)

			allTokens.push(...data.data)
		}

		return allTokens.map((token) => ({
			address: token.attributes.address,
			price: Number(token.attributes.price_usd),
		}))
	}

	validateChain(chain: string) {
		const some = geckoTerminalChains.some((c) => c.id === chain)
		if (!some) throw new Error(`Chain ${chain} not found`)
	}

	async getNetworks(): Promise<GeckoTerminalChain[]> {
		const networks: GeckoTerminalChain[] = []

		let page = 1

		while (true) {
			try {
				const { data } = await axios.get<{
					data: GeckoTerminalChain[]
				}>(`/networks`, {
					baseURL: this.baseUrl,
					params: {
						page,
					},
				})
				networks.push(...data.data)
				page++
			} catch (error) {
				if (
					isAxiosError(error) &&
					error.response?.status === 404 &&
					page !== 1
				)
					break

				throw error
			}
		}

		return networks
	}
}
