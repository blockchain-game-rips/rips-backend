import { TransactionFailedError } from '../../../domain/errors/transaction-failed.error'
import { SendTransactionResult } from '../evm-transaction.service'

/**
 * For senders that are not part of an attempt-reporting endpoint and still
 * surface a failed send as a thrown error.
 */
export function requireSucceeded(
	result: SendTransactionResult,
	operation: string,
): Extract<SendTransactionResult, { status: 'succeeded' }> {
	switch (result.status) {
		case 'succeeded':
			return result

		case 'reverted':
			throw new TransactionFailedError(
				`${operation} reverted: ${result.transaction.id}`,
			)

		case 'not-sent':
			throw new TransactionFailedError(
				`${operation} was not sent`,
				result.cause,
			)

		case 'unknown':
			throw new TransactionFailedError(
				`${operation} outcome is unknown${
					result.transactionId ? `: ${result.transactionId}` : ''
				}`,
				result.cause,
			)
	}
}
