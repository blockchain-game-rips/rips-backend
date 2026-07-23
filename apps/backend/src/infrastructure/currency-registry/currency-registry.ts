import { getAddress } from 'viem'
import { CurrencyMetadata } from '../../domain/entities/currency'
import { composeChainId } from '../../domain/services/chain-id-utils'
import { composeCurrencyId } from '../../domain/services/currency-id-utils'
import { Chain } from '../../domain/value-objects/chain'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { CurrencyId } from '../../domain/value-objects/currency-id'
import {
	CurrencyMetadataSource,
	CurrencyPriceSeedSource,
	SupportedCurrencies,
} from './currency-registry.interfaces'
import { EnrichedCurrency } from './enriched-currency'

function currencyIdOf(chain: Chain, address: string): CurrencyId {
	return composeCurrencyId(
		composeChainId(chain.namespace, chain.reference),
		getAddress(address),
	)
}

function labelOf(entry: ChainAddress): string {
	return `${entry.chain.namespace}:${entry.chain.reference}:${entry.address}`
}

/**
 * Single source of truth for currencies the system knows. Loaded once from the
 * committed enriched artifact. Exposes narrow, segregated projections so no
 * consumer sees fields it shouldn't (e.g. price provider never sees metadata).
 */
export class CurrencyRegistry
	implements
		CurrencyMetadataSource,
		CurrencyPriceSeedSource,
		SupportedCurrencies
{
	private readonly byId: Map<CurrencyId, EnrichedCurrency>
	private readonly supportedCurrencies: ChainAddress[]

	constructor(currencies: EnrichedCurrency[], allowList: ChainAddress[]) {
		this.byId = new Map(
			currencies.map((currency) => [
				currencyIdOf(currency.chain, currency.address),
				currency,
			]),
		)

		this.supportedCurrencies = this.resolveAllowList(allowList)
	}

	metadataOf(id: CurrencyId): CurrencyMetadata | undefined {
		return this.byId.get(id)?.metadata
	}

	seedPrices(): Map<CurrencyId, number> {
		const prices = new Map<CurrencyId, number>()

		for (const [id, currency] of this.byId) {
			prices.set(id, currency.lastKnownPrice)
		}

		return prices
	}

	supported(): ChainAddress[] {
		return this.supportedCurrencies
	}

	/**
	 * Fails fast at startup if any allowlisted currency is absent from the
	 * registry, so a request-path read can never throw.
	 */
	private resolveAllowList(allowList: ChainAddress[]): ChainAddress[] {
		const unknown = allowList.filter(
			(entry) => !this.byId.has(currencyIdOf(entry.chain, entry.address)),
		)

		if (unknown.length > 0) {
			const list = unknown.map(labelOf).join(', ')

			throw new Error(
				`Allowlisted currencies not in the enriched registry: ${list}`,
			)
		}

		return allowList.map((entry) => ({
			chain: entry.chain,
			address: getAddress(entry.address),
		}))
	}
}
