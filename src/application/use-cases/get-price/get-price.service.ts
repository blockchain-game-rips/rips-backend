import { Inject, Injectable } from '@nestjs/common'
import { Currency } from '../../../domain/entities/currency'
import { PriceProvider } from '../../interfaces/price-service'
import { MAIN_CURRENCY } from '../../interfaces/tokens'
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
