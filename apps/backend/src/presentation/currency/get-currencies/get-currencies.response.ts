import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Currency } from '../../../domain/entities/currency'
import { CurrencyDto } from '../../shared/currency.dto'
import { PricedCurrency } from '../../shared/pricing/priced-currency'

const getCurrenciesResponseSchema = z.object({
	currencies: z.array(CurrencyDto.schema),
})

export class GetCurrenciesResponseDto extends createZodDto(
	getCurrenciesResponseSchema,
) {}

export function toGetCurrenciesResponseDto(
	currencies: Currency[],
): GetCurrenciesResponseDto {
	return {
		currencies: currencies.map((currency) => new PricedCurrency(currency)),
	}
}
