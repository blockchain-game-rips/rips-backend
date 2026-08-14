/**
 * The point in the send sequence a failure occurred at. The status is derived
 * from this position rather than from the error, so no error-string matching
 * is involved.
 */
export enum SendPhase {
	Preparation = 'preparation',
	Signing = 'signing',
	Broadcast = 'broadcast',
	Receipt = 'receipt',
}

export type SendFailure =
	| { status: 'not-sent'; cause: unknown }
	| { status: 'unknown'; transactionId?: string; cause: unknown }

/**
 * Only claims not-sent when nothing was provably broadcast. A broadcast that
 * timed out may still have been propagated by the node, so it is unknown.
 */
export function classifySendFailure(
	phase: SendPhase,
	cause: unknown,
	transactionId?: string,
): SendFailure {
	if (phase === SendPhase.Preparation || phase === SendPhase.Signing) {
		return { status: 'not-sent', cause }
	}

	if (transactionId === undefined) {
		return { status: 'unknown', cause }
	}

	return { status: 'unknown', transactionId, cause }
}
