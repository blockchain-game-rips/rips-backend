import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PriceProvider } from '../../application/interfaces/price-service'
import { Currency } from '../../domain/entities/currency'
import { composeChainId } from '../../domain/services/chain-id-utils'
import {
	composeCurrencyId,
	parseCurrencyId,
} from '../../domain/services/currency-id-utils'
import { toChainNamespace } from '../../domain/value-objects/chain-namespace'
import { CurrencyId } from '../../domain/value-objects/currency-id'
import { createCustomError, wait } from '../../utils/common'
import {
	CURRENCY_PRICE_SEED_SOURCE,
	CurrencyPriceSeedSource,
} from '../currency-registry/currency-registry.interfaces'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { geckoNetworkOf, priceableAddress } from './currency-fetcher'
import { GeckoTerminalService } from './gecko-terminal.service'

const PriceProviderError = createCustomError('PriceProviderError')

const REFRESH_INTERVAL_MS = 1000 * 120
const INTER_CHAIN_REQUEST_DELAY_MS = 1000 * 12

@Injectable()
export class PriceProviderService
	extends PriceProvider
	implements OnModuleInit
{
	private priceCache: Map<CurrencyId, number> = new Map()
	private trackedCurrencies: Map<CurrencyId, Currency> = new Map()
	private logger = new Logger(PriceProviderService.name)

	constructor(
		readonly currencyService: EvmCurrencyService,
		readonly geckoTerminalService: GeckoTerminalService,
		@Inject(CURRENCY_PRICE_SEED_SOURCE)
		private readonly priceSeedSource: CurrencyPriceSeedSource,
	) {
		super()
	}

	async onModuleInit() {
		await this.loadSeed()

		this.scheduleRefresh()
	}

	private async loadSeed(): Promise<void> {
		const seed = this.priceSeedSource.seedPrices()

		for (const [currencyId, price] of seed) {
			try {
				const currency = await this.currencyService.fromId(currencyId)
				const cacheKey = this.getLookupId(currency)

				this.priceCache.set(cacheKey, price)
				this.trackedCurrencies.set(cacheKey, currency)
			} catch (error) {
				this.logger.warn(
					`Skipping seeded currency ${currencyId}: ${String(error)}`,
				)
			}
		}
	}

	private scheduleRefresh() {
		setTimeout(() => {
			this.refreshTracked()
				.catch((error) =>
					this.logger.error(error, 'Error updating prices:'),
				)
				.finally(() => this.scheduleRefresh())
		}, REFRESH_INTERVAL_MS).unref()
	}

	async getPrice(currency: Currency): Promise<number> {
		const prices = await this.getPrices([currency])

		const price = prices.get(currency.id)

		if (price === undefined) {
			throw new PriceProviderError(
				`Price not found for currency: ${currency.id}`,
			)
		}

		return price
	}

	async getPrices(currencies: Currency[]): Promise<Map<CurrencyId, number>> {
		const cacheKeys = currencies.map((c) => this.getLookupId(c))

		const missing = currencies.filter(
			(_, i) => !this.priceCache.has(cacheKeys[i]),
		)

		if (missing.length > 0) {
			await this.fetchAndCache(missing)
		}

		const result = new Map<CurrencyId, number>()
		for (let i = 0; i < currencies.length; i++) {
			const price = this.priceCache.get(cacheKeys[i])

			if (price !== undefined) {
				result.set(currencies[i].id, price)
			}
		}
		return result
	}

	private async fetchAndCache(currencies: Currency[]): Promise<void> {
		const byChain = this.groupByGeckoChain(currencies)
		const chains = Array.from(byChain.entries())

		for (let i = 0; i < chains.length; i++) {
			if (i > 0) await wait(INTER_CHAIN_REQUEST_DELAY_MS)

			const [geckoChainId, chainCurrencies] = chains[i]
			const lookupIds = chainCurrencies.map((c) => this.getLookupId(c))
			const addresses = lookupIds.map(
				(id) => this.parseLookupId(id).address,
			)

			const addressesAndPrices =
				await this.geckoTerminalService.getTokenPrices(
					addresses,
					geckoChainId,
				)

			for (let j = 0; j < chainCurrencies.length; j++) {
				const currency = chainCurrencies[j]
				const cacheKey = lookupIds[j]
				const address = addresses[j]

				const found = addressesAndPrices.find(
					(ap) => ap.address.toLowerCase() === address.toLowerCase(),
				)

				if (!found) {
					throw new PriceProviderError(
						`Price not found for currency: ${currency.id}`,
					)
				}

				this.priceCache.set(cacheKey, found.price)
				this.trackedCurrencies.set(cacheKey, currency)
			}
		}
	}

	private async refreshTracked(): Promise<void> {
		const currencies = Array.from(this.trackedCurrencies.values())

		if (currencies.length === 0) return

		await this.fetchAndCache(currencies)
	}

	private getLookupId(currency: Currency): CurrencyId {
		const { address, chainId: caip2ChainId } = parseCurrencyId(currency.id)

		const numericChainId = Number(caip2ChainId.split(':')[1])
		const wrappedAddress = priceableAddress(numericChainId, address)

		return composeCurrencyId(
			composeChainId(
				toChainNamespace(caip2ChainId.split(':')[0]),
				caip2ChainId.split(':')[1],
			),
			wrappedAddress,
		)
	}

	private parseLookupId(id: CurrencyId): {
		address: string
		geckoChainId: string
	} {
		const { chainId: caip2ChainId, address } = parseCurrencyId(id)

		const numericChainId = Number(caip2ChainId.split(':')[1])

		return { address, geckoChainId: geckoNetworkOf(numericChainId) }
	}

	private groupByGeckoChain(currencies: Currency[]): Map<string, Currency[]> {
		const byChain = new Map<string, Currency[]>()

		for (const currency of currencies) {
			const lookupId = this.getLookupId(currency)
			const { geckoChainId } = this.parseLookupId(lookupId)

			const group = byChain.get(geckoChainId) ?? []
			group.push(currency)
			byChain.set(geckoChainId, group)
		}

		return byChain
	}
}
