import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Currency } from '../../../domain/entities/currency'
import { CurrencyDto } from '../../shared/currency.dto'
import { PricedCurrency } from '../../shared/pricing/priced-currency'

const getSupportedCurrenciesResponseSchema = z.object({
	currencies: z.array(CurrencyDto.schema),
})

export class GetSupportedCurrenciesResponseDto extends createZodDto(
	getSupportedCurrenciesResponseSchema,
) {}

export function toGetSupportedCurrenciesResponseDto(
	currencies: Currency[],
): GetSupportedCurrenciesResponseDto {
	return {
		currencies: currencies.map((currency) => new PricedCurrency(currency)),
	}
}
