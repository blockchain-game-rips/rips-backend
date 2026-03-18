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
		symbol: balance.token.symbol,
		name: balance.token.name,
		decimals: balance.token.decimals,
	}
}
