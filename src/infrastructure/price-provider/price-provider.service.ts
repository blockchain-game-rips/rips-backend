import { Injectable, Logger } from '@nestjs/common'
import { PriceProvider } from 'src/application/interfaces/price-service'
import { Currency } from 'src/domain/entities/currency'
import { parseCurrencyId } from 'src/domain/services/currency-id-utils'
import { CurrencyId } from 'src/domain/value-objects/currency-id'
import { createCustomError } from 'src/utils/common'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { NATIVE_ADDRESS } from '../evm/primitives/currencies/constants'
import { chainIdToGeckoChainId } from './constants'
import { GeckoTerminalService } from './gecko-terminal.service'

const PriceProviderError = createCustomError('PriceProviderError')

const UPDATE_INTERVAL_MS = 1000 * 60 * 5

@Injectable()
export class PriceProviderService extends PriceProvider {
	private priceCache: Map<CurrencyId, number> = new Map()
	private trackedCurrencies: Map<CurrencyId, Currency> = new Map()
	private logger = new Logger(PriceProviderService.name)

	constructor(
		readonly currencyService: EvmCurrencyService,
		readonly geckoTerminalService: GeckoTerminalService,
	) {
		super()

		setInterval(() => {
			this.refreshTracked().catch((error) =>
				this.logger.error('Error updating prices:', error),
			)
		}, UPDATE_INTERVAL_MS).unref()
	}

	async getPrice(currency: Currency): Promise<number> {
		const prices = await this.getPrices([currency])
		return prices.get(currency.id)!
	}

	async getPrices(currencies: Currency[]): Promise<Map<CurrencyId, number>> {
		const missing = currencies.filter((c) => !this.priceCache.has(c.id))

		if (missing.length > 0) {
			await this.fetchAndCache(currencies)
		}

		const result = new Map<CurrencyId, number>()
		for (const currency of currencies) {
			result.set(currency.id, this.priceCache.get(currency.id)!)
		}
		return result
	}

	private async fetchAndCache(currencies: Currency[]): Promise<void> {
		const byChain = await this.groupByGeckoChain(currencies)

		for (const [geckoChainId, chainCurrencies] of byChain.entries()) {
			const lookupIds = await Promise.all(
				chainCurrencies.map((c) => this.getLookupId(c)),
			)
			const addresses = lookupIds.map(
				(id) => this.parseLookupId(id).address,
			)

			const addressesAndPrices =
				await this.geckoTerminalService.getTokenPrices(
					addresses,
					geckoChainId,
				)

			for (let i = 0; i < chainCurrencies.length; i++) {
				const currency = chainCurrencies[i]
				const address = addresses[i]

				const found = addressesAndPrices.find(
					(ap) => ap.address.toLowerCase() === address.toLowerCase(),
				)

				if (!found) {
					throw new PriceProviderError(
						`Price not found for currency: ${currency.id}`,
					)
				}

				this.priceCache.set(currency.id, found.price)
				this.trackedCurrencies.set(currency.id, currency)
			}
		}
	}

	private async refreshTracked(): Promise<void> {
		const currencies = Array.from(this.trackedCurrencies.values())

		if (currencies.length === 0) return

		await this.fetchAndCache(currencies)
	}

	private async getLookupId(currency: Currency): Promise<CurrencyId> {
		const { address, chainId: caip2ChainId } = parseCurrencyId(currency.id)

		if (address.toLowerCase() === NATIVE_ADDRESS.toLowerCase()) {
			const numericChainId = Number(caip2ChainId.split(':')[1])

			const wrapped =
				await this.currencyService.getWrappedNative(numericChainId)

			return wrapped.id
		}

		return currency.id
	}

	private parseLookupId(id: CurrencyId): {
		address: string
		geckoChainId: string
	} {
		const { chainId: caip2ChainId, address } = parseCurrencyId(id)

		const numericChainId = Number(caip2ChainId.split(':')[1])

		const geckoChainId = this.getGeckoChainId(numericChainId)

		return { address, geckoChainId }
	}

	private async groupByGeckoChain(
		currencies: Currency[],
	): Promise<Map<string, Currency[]>> {
		const byChain = new Map<string, Currency[]>()

		for (const currency of currencies) {
			const lookupId = await this.getLookupId(currency)
			const { geckoChainId } = this.parseLookupId(lookupId)

			if (!byChain.has(geckoChainId)) byChain.set(geckoChainId, [])
			byChain.get(geckoChainId)!.push(currency)
		}

		return byChain
	}

	private getGeckoChainId(chainId: number): string {
		const key = String(chainId) as keyof typeof chainIdToGeckoChainId
		const geckoId = chainIdToGeckoChainId[key]

		if (!geckoId) {
			throw new PriceProviderError(
				`Unsupported chainId for PriceProvider: ${chainId}`,
			)
		}

		return geckoId
	}
}
