import { CurrencyAmount } from 'src/domain/value-objects/currency-amount'

export type BalanceResponseDto = {
	amount: string
	symbol: string
	name?: string
	decimals: number
}

export function toBalanceResponseDto(
	balance: CurrencyAmount,
): BalanceResponseDto {
	return {
		amount: balance.amount.toString(),
		symbol: balance.currency.symbol,
		name: balance.currency.name,
		decimals: balance.currency.decimals,
	}
}
