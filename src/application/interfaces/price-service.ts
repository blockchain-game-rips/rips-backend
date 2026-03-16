import { CurrencyId } from 'src/domain/value-objects/currency-id'
import { Currency } from '../../domain/entities/currency'

export interface PriceProvider {
	getPrice(token: Currency): Promise<number>
	getPrices(tokens: Currency[]): Promise<Map<CurrencyId, number>>
}

export const PRICE_PROVIDER_TOKEN = Symbol('PRICE_PROVIDER_TOKEN')
