import { Injectable } from '@nestjs/common'
import { CurrencyService } from '../../interfaces/currency.service'
import { PriceProvider } from '../../interfaces/price-service'
import { GetPriceInput, GetPriceUseCase } from './get-price.use-case'

@Injectable()
export class GetPriceService extends GetPriceUseCase {
	constructor(
		private readonly priceProvider: PriceProvider,
		private readonly currencyService: CurrencyService,
	) {
		super()
	}

	async execute(input: GetPriceInput): Promise<number> {
		const currency = await this.currencyService.fromAccount(
			input.currencyChainAddress,
		)

		return await this.priceProvider.getPrice(currency)
	}
}
