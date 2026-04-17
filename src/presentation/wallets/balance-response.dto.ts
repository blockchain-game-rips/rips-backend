import { CurrencyAmount } from '../../domain/value-objects/currency-amount'
import { PlainCurrencyAmount, toPlainCurrencyAmount } from '../to-plain'

export type BalanceResponseDto = PlainCurrencyAmount

export function toBalanceResponseDto(
	currencyAmount: CurrencyAmount,
): BalanceResponseDto {
	return toPlainCurrencyAmount(currencyAmount)
}
