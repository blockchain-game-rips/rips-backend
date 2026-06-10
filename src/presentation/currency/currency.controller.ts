import { Controller, Get, Query } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { CurrencyService } from '../../application/interfaces/currency.service'
import { PriceProvider } from '../../application/interfaces/price-service'
import { GetCurrenciesQueryDto } from './get-currencies/get-currencies.request'
import {
	GetCurrenciesResponseDto,
	toGetCurrenciesResponseDto,
} from './get-currencies/get-currencies.response'

@Controller('currencies')
export class CurrencyController {
	constructor(
		private readonly currencyService: CurrencyService,
		private readonly priceProvider: PriceProvider,
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

		const prices = await this.priceProvider.getPrices(currencies)

		return toGetCurrenciesResponseDto(
			currencies.map((currency) => ({
				currency,
				priceUsd: prices.get(currency.id) ?? 0,
			})),
		)
	}
}
