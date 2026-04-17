import { ChainAddress } from '../../domain/value-objects/chain-address'
import { Transaction } from '../../domain/value-objects/transaction'

export type WithdrawResponseDto = {
	txId: string
	cost?: {
		currency: {
			chainAddress: ChainAddress
			symbol: string
			name: string
			decimals: number
		}
		amount: string
	}
}

export function toWithdrawResponseDto(tx: Transaction): WithdrawResponseDto {
	if (tx.cost === undefined) {
		return {
			txId: tx.id,
		}
	}

	return {
		txId: tx.id,
		cost: {
			currency: {
				chainAddress: tx.cost.currency.chainAddress,
				symbol: tx.cost.currency.symbol,
				name: tx.cost.currency.name,
				decimals: tx.cost.currency.decimals,
			},
			amount: tx.cost.amount.toString(),
		},
	}
}
