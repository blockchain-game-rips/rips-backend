import { Currency } from '../../../domain/entities/currency'
import { CurrencyId } from '../../../domain/value-objects/currency-id'

export type GetPriceInput = {
	currency: Currency
}

export type GetPricesInput = {
	currencies: Currency[]
}

export abstract class GetPriceUseCase {
	abstract execute(input: GetPriceInput): Promise<number>
	abstract executeMany(
		input: GetPricesInput,
	): Promise<Map<CurrencyId, number>>
}
