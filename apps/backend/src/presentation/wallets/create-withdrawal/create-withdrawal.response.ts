import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { TransactionAttempt } from '../../../domain/value-objects/transaction-attempt'
import {
	toTransactionAttemptDto,
	transactionAttemptSchema,
} from '../../shared/transaction-attempt.dto'

const createWithdrawalResponseSchema = z.object({
	withdrawal: transactionAttemptSchema(),
})

export class CreateWithdrawalResponseDto extends createZodDto(
	createWithdrawalResponseSchema,
) {}

export function toCreateWithdrawalResponseDto(
	attempt: TransactionAttempt,
): CreateWithdrawalResponseDto {
	return { withdrawal: toTransactionAttemptDto(attempt) }
}
