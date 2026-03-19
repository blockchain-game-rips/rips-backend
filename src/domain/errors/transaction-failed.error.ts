export class TransactionFailedError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown,
	) {
		super(message)
		this.name = 'TransactionFailedError'
	}
}
