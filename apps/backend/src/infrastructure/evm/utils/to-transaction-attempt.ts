import {
	TransactionAttempt,
	UnsuccessfulAttempt,
} from '../../../domain/value-objects/transaction-attempt'
import { SendTransactionResult } from '../evm-transaction.service'

export function toTransactionAttempt(
	result: SendTransactionResult,
): TransactionAttempt {
	if (result.status === 'succeeded') {
		return { status: 'succeeded', transaction: result.transaction }
	}

	return toUnsuccessfulAttempt(result)
}

/**
 * The arms that carry no operation result, so they fit an attempt with any
 * result payload.
 */
export function toUnsuccessfulAttempt(
	result: Exclude<SendTransactionResult, { status: 'succeeded' }>,
): UnsuccessfulAttempt {
	switch (result.status) {
		case 'reverted':
			return { status: 'reverted', transaction: result.transaction }

		case 'not-sent':
			return { status: 'not-sent' }

		case 'unknown':
			return result.transactionId === undefined
				? { status: 'unknown' }
				: { status: 'unknown', transactionId: result.transactionId }
	}
}
