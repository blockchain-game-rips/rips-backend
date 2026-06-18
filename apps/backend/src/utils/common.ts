import dotenv from 'dotenv'

dotenv.config()
export function getEnvSafe(key: string): string {
	const value = process.env[key]

	if (!value) {
		throw new Error(`Environment variable ${key} is not set`)
	}

	return value
}

export const wait = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms))

export class ContextError extends Error {
	constructor(
		message: string,
		public context?: unknown,
	) {
		super(message)
	}
}

export function createCustomError(errorName: string) {
	return class CustomError extends ContextError {
		constructor(message: string, context?: unknown) {
			super(message, context)
			Object.setPrototypeOf(this, new.target.prototype)
			this.name = errorName
		}
	}
}
