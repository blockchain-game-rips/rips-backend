import { createZodDto } from 'nestjs-zod'
import { Transaction } from '../../../domain/value-objects/transaction'
import { toTransactionDto, TransactionDto } from '../../shared/transaction.dto'

export class CreateWithdrawalResponseDto extends createZodDto(
	TransactionDto.schema,
) {}

export function toCreateWithdrawalResponseDto(
	tx: Transaction,
): CreateWithdrawalResponseDto {
	return toTransactionDto(tx)
}
