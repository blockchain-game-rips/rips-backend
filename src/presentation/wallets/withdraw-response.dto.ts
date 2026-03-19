import { Transaction } from 'src/domain/value-objects/transaction'

export type WithdrawResponseDto = {
	txHash: string
	gasCost: string
}

export function toWithdrawResponseDto(tx: Transaction): WithdrawResponseDto {
	return {
		txHash: tx.id,
		gasCost: tx.cost.amount.toString(),
	}
}
