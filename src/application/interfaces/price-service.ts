import { CurrencyId } from 'src/domain/value-objects/currency-id'
import { Currency } from '../../domain/entities/currency'

export abstract class PriceProvider {
	abstract getPrice(token: Currency): Promise<number>

	abstract getPrices(tokens: Currency[]): Promise<Map<CurrencyId, number>>
}
