import { Controller, Get, Query } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { CurrencyService } from '../../application/interfaces/currency.service'
import { GetPriceUseCase } from '../../application/use-cases/get-price/get-price.use-case'
import { GetCurrenciesQueryDto } from './get-currencies/get-currencies.request'
import {
	GetCurrenciesResponseDto,
	toGetCurrenciesResponseDto,
} from './get-currencies/get-currencies.response'

@Controller('currencies')
export class CurrencyController {
	constructor(
		private readonly currencyService: CurrencyService,
		private readonly getPriceUseCase: GetPriceUseCase,
	) {}

	@Get()
	@ZodResponse({ type: GetCurrenciesResponseDto })
	async getCurrencies(
		@Query() query: GetCurrenciesQueryDto,
	): Promise<GetCurrenciesResponseDto> {
		const currencies = await Promise.all(
			query.chainAddress.map((chainAddress) =>
				this.currencyService.fromAccount(chainAddress),
			),
		)

		const prices = await this.getPriceUseCase.executeMany({ currencies })

		return toGetCurrenciesResponseDto(
			currencies.map((currency) => ({
				currency,
				priceUsd: prices.get(currency.id) ?? 0,
			})),
		)
	}
}
