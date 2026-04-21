import { Injectable } from '@nestjs/common'
import { CurrencyId } from '../../../domain/value-objects/currency-id'
import { PriceProvider } from '../../interfaces/price-service'
import {
	GetPriceInput,
	GetPricesInput,
	GetPriceUseCase,
} from './get-price.use-case'

@Injectable()
export class GetPriceService extends GetPriceUseCase {
	constructor(private readonly priceProvider: PriceProvider) {
		super()
	}

	async execute(input: GetPriceInput): Promise<number> {
		return await this.priceProvider.getPrice(input.currency)
	}

	async executeMany(input: GetPricesInput): Promise<Map<CurrencyId, number>> {
		return await this.priceProvider.getPrices(input.currencies)
	}
}
