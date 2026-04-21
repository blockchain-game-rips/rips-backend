import { createZodDto } from 'nestjs-zod'
import { Transaction } from '../../domain/value-objects/transaction'
import { toPlainTransaction } from '../to-plain'
import { PlainTransactionZ } from '../to-plain-schemas'

export class WithdrawResponseDto extends createZodDto(PlainTransactionZ) {}

export function toWithdrawResponseDto(tx: Transaction): WithdrawResponseDto {
	return toPlainTransaction(tx)
}
