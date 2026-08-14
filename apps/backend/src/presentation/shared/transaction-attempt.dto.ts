import { z, ZodType } from 'zod'
import {
	TransactionAttempt,
	TransactionAttemptWith,
} from '../../domain/value-objects/transaction-attempt'
import { toTransactionDto, TransactionDto } from './transaction.dto'

const NOT_SENT_DESCRIPTION =
	'Nothing reached the chain. No gas was spent. Safe to retry.'

const SUCCEEDED_DESCRIPTION = 'Mined successfully.'

const REVERTED_DESCRIPTION = 'Mined and reverted. The gas was spent.'

const UNKNOWN_DESCRIPTION =
	'The outcome was lost. Reconcile against the chain before retrying.'

const notSentSchema = z
	.object({ status: z.literal('not-sent') })
	.describe(NOT_SENT_DESCRIPTION)

const revertedSchema = z
	.object({
		status: z.literal('reverted'),
		transaction: TransactionDto.schema,
	})
	.describe(REVERTED_DESCRIPTION)

const unknownSchema = z
	.object({
		status: z.literal('unknown'),
		transactionId: z.string().nullable(),
	})
	.describe(UNKNOWN_DESCRIPTION)

export function transactionAttemptSchema<T extends ZodType>(resultSchema?: T) {
	const succeededSchema = z
		.object({
			status: z.literal('succeeded'),
			transaction: TransactionDto.schema,
			...(resultSchema ? { result: resultSchema } : {}),
		})
		.describe(SUCCEEDED_DESCRIPTION)

	return z.discriminatedUnion('status', [
		notSentSchema,
		succeededSchema,
		revertedSchema,
		unknownSchema,
	])
}

/**
 * An approval is absent when the currency is native or the allowance already
 * covered the amount.
 */
export const approvalAttemptSchema = () => transactionAttemptSchema().nullable()

export function toApprovalAttemptDto(attempt: TransactionAttempt | undefined) {
	return attempt ? toTransactionAttemptDto(attempt) : null
}

export function toTransactionAttemptDto(attempt: TransactionAttempt) {
	if (attempt.status === 'succeeded') {
		return {
			status: attempt.status,
			transaction: toTransactionDto(attempt.transaction),
		}
	}

	return toUnsuccessfulAttemptDto(attempt)
}

export function toTransactionAttemptWithDto<T, D>(
	attempt: TransactionAttemptWith<T>,
	toResultDto: (result: T) => D,
) {
	if (attempt.status === 'succeeded') {
		return {
			status: attempt.status,
			transaction: toTransactionDto(attempt.transaction),
			result: toResultDto(attempt.result),
		}
	}

	return toUnsuccessfulAttemptDto(attempt)
}

function toUnsuccessfulAttemptDto(
	attempt: Exclude<TransactionAttempt, { status: 'succeeded' }>,
) {
	switch (attempt.status) {
		case 'not-sent':
			return { status: attempt.status }

		case 'reverted':
			return {
				status: attempt.status,
				transaction: toTransactionDto(attempt.transaction),
			}

		case 'unknown':
			return {
				status: attempt.status,
				transactionId: attempt.transactionId ?? null,
			}
	}
}
