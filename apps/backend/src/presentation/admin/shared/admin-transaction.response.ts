import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { TransactionAttempt } from '../../../domain/value-objects/transaction-attempt'
import {
	toTransactionAttemptDto,
	transactionAttemptSchema,
} from '../../shared/transaction-attempt.dto'

const adminTransactionResponseSchema = z.object({
	transaction: transactionAttemptSchema(),
})

export class AdminTransactionResponseDto extends createZodDto(
	adminTransactionResponseSchema,
) {}

export function toAdminTransactionResponseDto(
	attempt: TransactionAttempt,
): AdminTransactionResponseDto {
	return { transaction: toTransactionAttemptDto(attempt) }
}
