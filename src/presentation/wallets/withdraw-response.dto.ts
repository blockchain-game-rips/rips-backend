import { Transaction } from '../../domain/value-objects/transaction'
import { PlainTransaction, toPlainTransaction } from '../to-plain'

export type WithdrawResponseDto = PlainTransaction

export function toWithdrawResponseDto(tx: Transaction): WithdrawResponseDto {
	return toPlainTransaction(tx)
}
