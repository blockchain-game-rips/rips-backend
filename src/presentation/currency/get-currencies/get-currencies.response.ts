import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Currency } from '../../../domain/entities/currency'
import { CurrencyDto, toCurrencyDto } from '../../shared/currency.dto'

const getCurrenciesResponseSchema = z.object({
	currencies: z.array(CurrencyDto.schema),
})

export class GetCurrenciesResponseDto extends createZodDto(
	getCurrenciesResponseSchema,
) {}

export function toGetCurrenciesResponseDto(
	currencies: { currency: Currency; priceUsd: number }[],
): GetCurrenciesResponseDto {
	return {
		currencies: currencies.map(({ currency, priceUsd }) =>
			toCurrencyDto(currency, priceUsd),
		),
	}
}
