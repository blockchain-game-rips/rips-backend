import { Controller, Get } from '@nestjs/common'
import { GetPriceUseCase } from 'src/application/use-cases/get-price/get-price.use-case'
import { PriceResponseDto, toPriceResponseDto } from './price-response.dto'

@Controller()
export class PriceController {
	constructor(private readonly getPriceUseCase: GetPriceUseCase) {}

	@Get('main-currency')
	async getMainCurrencyPrice(): Promise<PriceResponseDto> {
		const price = await this.getPriceUseCase.execute()

		return toPriceResponseDto(price)
	}
}
