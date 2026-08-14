import { Transaction } from './transaction'

export type UnsuccessfulAttempt =
	| { status: 'not-sent' }
	| { status: 'reverted'; transaction: Transaction }
	| { status: 'unknown'; transactionId?: string }

export type TransactionAttempt =
	| { status: 'succeeded'; transaction: Transaction }
	| UnsuccessfulAttempt

export type TransactionAttemptWith<T> =
	| { status: 'succeeded'; transaction: Transaction; result: T }
	| UnsuccessfulAttempt

export const NOT_SENT: UnsuccessfulAttempt = { status: 'not-sent' }

export function attemptTransactionId<T>(
	attempt: TransactionAttempt | TransactionAttemptWith<T>,
): string | undefined {
	switch (attempt.status) {
		case 'succeeded':
		case 'reverted':
			return attempt.transaction.id

		case 'not-sent':
			return undefined

		case 'unknown':
			return attempt.transactionId
	}
}
