import { Currency } from '../../domain/entities/currency'
import { CurrencyId } from '../../domain/value-objects/currency-id'

export abstract class PriceProvider {
	abstract getPrice(token: Currency): Promise<number>

	abstract getPrices(tokens: Currency[]): Promise<Map<CurrencyId, number>>
}
