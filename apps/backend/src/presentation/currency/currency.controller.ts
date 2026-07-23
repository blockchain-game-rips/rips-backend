import { Controller, Get, Inject, Query, UseInterceptors } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { CurrencyService } from '../../application/interfaces/currency.service'
import {
	SUPPORTED_CURRENCIES,
	SupportedCurrencies,
} from '../../infrastructure/currency-registry/currency-registry.interfaces'
import { PriceEnrichmentInterceptor } from '../shared/pricing/price-enrichment.interceptor'
import { GetCurrenciesQueryDto } from './get-currencies/get-currencies.request'
import {
	GetCurrenciesResponseDto,
	toGetCurrenciesResponseDto,
} from './get-currencies/get-currencies.response'
import {
	GetSupportedCurrenciesResponseDto,
	toGetSupportedCurrenciesResponseDto,
} from './get-supported-currencies/get-supported-currencies.response'

@Controller('currencies')
@UseInterceptors(PriceEnrichmentInterceptor)
export class CurrencyController {
	constructor(
		private readonly currencyService: CurrencyService,
		@Inject(SUPPORTED_CURRENCIES)
		private readonly supportedCurrencies: SupportedCurrencies,
	) {}

	@Get('supported')
	@ZodResponse({ type: GetSupportedCurrenciesResponseDto })
	async getSupportedCurrencies(): Promise<GetSupportedCurrenciesResponseDto> {
		const currencies = await Promise.all(
			this.supportedCurrencies
				.supported()
				.map((chainAddress) =>
					this.currencyService.fromAccount(chainAddress),
				),
		)

		return toGetSupportedCurrenciesResponseDto(currencies)
	}

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
