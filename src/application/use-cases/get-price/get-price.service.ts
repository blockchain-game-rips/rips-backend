import { Inject, Injectable } from '@nestjs/common'
import { PriceProvider } from 'src/application/interfaces/price-service'
import { MAIN_CURRENCY } from 'src/application/interfaces/tokens'
import { Currency } from 'src/domain/entities/currency'
import { GetPriceUseCase } from './get-price.use-case'

@Injectable()
export class GetPriceService extends GetPriceUseCase {
	constructor(
		@Inject(MAIN_CURRENCY) private readonly mainCurrency: Currency,
		private readonly priceProvider: PriceProvider,
	) {
		super()
	}

	async execute(): Promise<number> {
		return await this.priceProvider.getPrice(this.mainCurrency)
	}
}
