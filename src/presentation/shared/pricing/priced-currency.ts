import { Currency } from '../../../domain/entities/currency'
import { toChainAddressDto } from '../chain-address.dto'

const PRICE_PENDING = 0

/**
 * Wire-shape mirror of CurrencyDto whose `priceUsd` is filled in later by the
 * PriceEnrichmentInterceptor. The `currency` reference is non-enumerable so it
 * is never serialized into the HTTP response.
 */
export class PricedCurrency {
	readonly id: string
	readonly chainAddress: ReturnType<typeof toChainAddressDto>
	readonly symbol: string
	readonly name: string
	readonly decimals: number

	priceUsd: number = PRICE_PENDING

	constructor(readonly currency: Currency) {
		this.id = currency.id

		this.chainAddress = toChainAddressDto(currency.chainAddress)
		this.symbol = currency.symbol
		this.name = currency.name
		this.decimals = currency.decimals

		Object.defineProperty(this, 'currency', {
			value: currency,
			enumerable: false,
		})
	}
}
