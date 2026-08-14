import { Transaction } from '../../src/domain/value-objects/transaction'
import { TransactionAttemptWith } from '../../src/domain/value-objects/transaction-attempt'

/**
 * Unwraps the succeeded arm of an attempt, failing with the actual status so a
 * test that hits a revert reports why rather than a missing-property error.
 */
export function expectSucceeded<T>(attempt: TransactionAttemptWith<T>): {
	transaction: Transaction
	result: T
} {
	if (attempt.status !== 'succeeded') {
		throw new Error(`Expected a succeeded attempt, got '${attempt.status}'`)
	}

	return { transaction: attempt.transaction, result: attempt.result }
}
