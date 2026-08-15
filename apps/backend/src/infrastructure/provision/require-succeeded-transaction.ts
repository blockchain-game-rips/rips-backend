import { Transaction } from '../../domain/value-objects/transaction'
import { TransactionAttempt } from '../../domain/value-objects/transaction-attempt'

/**
 * Provisioning runs at startup with no client to report an outcome to, so a
 * transaction that did not land must stop the boot rather than be carried on.
 */
export function requireSucceeded(
	attempt: TransactionAttempt,
	operation: string,
): Transaction {
	switch (attempt.status) {
		case 'succeeded':
			return attempt.transaction

		case 'reverted':
			throw new Error(`${operation} reverted: ${attempt.transaction.id}`)

		case 'not-sent':
			throw new Error(`${operation} was not sent`)

		case 'unknown':
			throw new Error(
				`${operation} outcome is unknown${
					attempt.transactionId ? `: ${attempt.transactionId}` : ''
				}`,
			)
	}
}
