import { Controller, Get, Query } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { CurrencyService } from '../../application/interfaces/currency.service'
import { GetCurrencyIdQueryDto } from './get-currency-id/get-currency-id.request'
import {
	GetCurrencyIdResponseDto,
	toGetCurrencyIdResponseDto,
} from './get-currency-id/get-currency-id.response'

@Controller('currency')
export class CurrencyController {
	constructor(private readonly currencyService: CurrencyService) {}

	@Get('id')
	@ZodResponse({ type: GetCurrencyIdResponseDto })
	async getCurrencyId(
		@Query() query: GetCurrencyIdQueryDto,
	): Promise<GetCurrencyIdResponseDto> {
		const currency = await this.currencyService.fromAccount(
			query.chainAddress,
		)

		return toGetCurrencyIdResponseDto(currency.id)
	}
}
