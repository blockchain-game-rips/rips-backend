import { ChainAddress } from 'src/domain/value-objects/chain-address'
import { CurrencyAmount } from 'src/domain/value-objects/currency-amount'

export type BalanceResponseDto = {
	currency: {
		account: ChainAddress
		symbol: string
		name?: string
		decimals: number
	}
	amount: string
}

export function toBalanceResponseDto(
	currencyAmount: CurrencyAmount,
): BalanceResponseDto {
	return {
		currency: {
			account: currencyAmount.currency.account,
			symbol: currencyAmount.currency.symbol,
			name: currencyAmount.currency.name,
			decimals: currencyAmount.currency.decimals,
		},
		amount: currencyAmount.amount.toString(),
	}
}
