import { ChainAddress } from 'src/domain/value-objects/chain-address'
import { CurrencyAmount } from 'src/domain/value-objects/currency-amount'

export type BalanceResponseDto = {
	currency: {
		chainAddress: ChainAddress
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
			chainAddress: currencyAmount.currency.chainAddress,
			symbol: currencyAmount.currency.symbol,
			name: currencyAmount.currency.name,
			decimals: currencyAmount.currency.decimals,
		},
		amount: currencyAmount.amount.toString(),
	}
}
