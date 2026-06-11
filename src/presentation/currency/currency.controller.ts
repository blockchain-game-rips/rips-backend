import { Controller, Get, Query, UseInterceptors } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { CurrencyService } from '../../application/interfaces/currency.service'
import { PriceEnrichmentInterceptor } from '../shared/pricing/price-enrichment.interceptor'
import { GetCurrenciesQueryDto } from './get-currencies/get-currencies.request'
import {
	GetCurrenciesResponseDto,
	toGetCurrenciesResponseDto,
} from './get-currencies/get-currencies.response'

@Controller('currencies')
@UseInterceptors(PriceEnrichmentInterceptor)
export class CurrencyController {
	constructor(private readonly currencyService: CurrencyService) {}

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

		return toGetCurrenciesResponseDto(currencies)
	}
}
