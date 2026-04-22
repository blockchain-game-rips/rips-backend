import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import {
	CurrencyAmountDto,
	toCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const getBalancesResponseSchema = z.object({
	balances: z.array(CurrencyAmountDto.schema),
})

export class GetBalancesResponseDto extends createZodDto(
	getBalancesResponseSchema,
) {}

export function toGetBalancesResponseDto(
	balances: { currencyAmount: CurrencyAmount; priceUsd: number }[],
): GetBalancesResponseDto {
	return {
		balances: balances.map(({ currencyAmount, priceUsd }) =>
			toCurrencyAmountDto(currencyAmount, priceUsd),
		),
	}
}
