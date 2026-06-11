import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const getBalancesResponseSchema = z.object({
	balances: z.array(CurrencyAmountDto.schema),
})

export class GetBalancesResponseDto extends createZodDto(
	getBalancesResponseSchema,
) {}

export function toGetBalancesResponseDto(
	balances: CurrencyAmount[],
): GetBalancesResponseDto {
	return {
		balances: balances.map(toPricedCurrencyAmountDto),
	}
}
