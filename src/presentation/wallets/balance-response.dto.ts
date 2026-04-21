import { createZodDto } from 'nestjs-zod'
import { CurrencyAmount } from '../../domain/value-objects/currency-amount'
import { toPlainCurrencyAmount } from '../to-plain'
import { PlainCurrencyAmountZ } from '../to-plain-schemas'

export class BalanceResponseDto extends createZodDto(PlainCurrencyAmountZ) {}

export function toBalanceResponseDto(
	currencyAmount: CurrencyAmount,
	priceUsd: number,
): BalanceResponseDto {
	return toPlainCurrencyAmount(currencyAmount, priceUsd)
}
