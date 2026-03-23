import { ChainAddress } from 'src/domain/value-objects/chain-address'
import { Transaction } from 'src/domain/value-objects/transaction'

export type WithdrawResponseDto = {
	txId: string
	cost: {
		currency: {
			account: ChainAddress
			symbol: string
			name: string
			decimals: number
		}
		amount: string
	}
}

export function toWithdrawResponseDto(tx: Transaction): WithdrawResponseDto {
	return {
		txId: tx.id,
		cost: {
			currency: {
				account: tx.cost.currency.account,
				symbol: tx.cost.currency.symbol,
				name: tx.cost.currency.name,
				decimals: tx.cost.currency.decimals,
			},
			amount: tx.cost.amount.toString(),
		},
	}
}
