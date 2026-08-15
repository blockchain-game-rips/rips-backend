import { TransactionReceipt } from 'viem'
import {
	TransactionAttempt,
	TransactionAttemptWith,
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
 * A transaction that mined successfully but whose result cannot be read back
 * leaves us unable to say what the operation did, so the outcome is genuinely
 * unknown rather than a server failure.
 */
export function toAttemptWithParsedResult<T>(
	result: SendTransactionResult,
	parseResult: (receipt: TransactionReceipt) => T | null | undefined,
): TransactionAttemptWith<T> {
	if (result.status !== 'succeeded') {
		return toUnsuccessfulAttempt(result)
	}

	const parsed = parseResult(result.receipt)

	if (parsed === null || parsed === undefined) {
		return { status: 'unknown', transactionId: result.transaction.id }
	}

	return {
		status: 'succeeded',
		transaction: result.transaction,
		result: parsed,
	}
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
