import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { CurrencyAmount } from '../../domain/value-objects/currency-amount'
import { CurrencyDto, toCurrencyDto } from './currency.dto'

const currencyAmountSchema = z.object({
	currency: CurrencyDto.schema,
	amount: z.string(),
})

export class CurrencyAmountDto extends createZodDto(currencyAmountSchema) {}

export function toCurrencyAmountDto(
	currencyAmount: CurrencyAmount,
	priceUsd: number,
): CurrencyAmountDto {
	return {
		currency: toCurrencyDto(currencyAmount.currency, priceUsd),
		amount: currencyAmount.amount.toString(),
	}
}
