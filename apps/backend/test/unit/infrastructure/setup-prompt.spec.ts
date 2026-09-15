import {
	DEFAULT_EXECUTOR_COUNT,
	promptExecutorCount,
	promptPrivateKey,
	type PromptReader,
} from '../../../src/setup/prompt'

const stubReader = (answers: string[]): PromptReader => {
	const remaining = [...answers]

	return {
		question: () => Promise.resolve(remaining.shift() ?? ''),
		questionHidden: () => Promise.resolve(remaining.shift() ?? ''),
	}
}

describe('promptPrivateKey', () => {
	it('should return the key the operator typed', async () => {
		const key = `0x${'a'.repeat(64)}`

		await expect(promptPrivateKey(stubReader([key]))).resolves.toBe(key)
	})

	it('should trim surrounding whitespace from a pasted key', async () => {
		const key = `0x${'b'.repeat(64)}`

		await expect(
			promptPrivateKey(stubReader([`  ${key}\n`])),
		).resolves.toBe(key)
	})

	/**
	 * The key never reaches an echoing prompt: it is the one input that must not
	 * land in a terminal scrollback.
	 */
	it('should read the key through the hidden channel', async () => {
		const questionHidden = vi.fn().mockResolvedValue(`0x${'c'.repeat(64)}`)
		const question = vi.fn().mockResolvedValue('')

		await promptPrivateKey({ question, questionHidden })

		expect(questionHidden).toHaveBeenCalledOnce()
		expect(question).not.toHaveBeenCalled()
	})

	it('should reject an empty answer rather than seed an empty wallet', async () => {
		await expect(promptPrivateKey(stubReader(['   ']))).rejects.toThrow(
			/private key/i,
		)
	})
})

describe('promptExecutorCount', () => {
	it('should return the number the operator typed', async () => {
		await expect(promptExecutorCount(stubReader(['5']))).resolves.toBe(5)
	})

	it('should fall back to the default on an empty answer', async () => {
		await expect(promptExecutorCount(stubReader(['']))).resolves.toBe(
			DEFAULT_EXECUTOR_COUNT,
		)
	})

	it('should trim whitespace around the number', async () => {
		await expect(promptExecutorCount(stubReader([' 3 ']))).resolves.toBe(3)
	})

	it('should reject a non-numeric answer', async () => {
		await expect(promptExecutorCount(stubReader(['two']))).rejects.toThrow(
			/executor count/i,
		)
	})

	it('should reject zero, a negative, or a fractional count', async () => {
		await expect(promptExecutorCount(stubReader(['0']))).rejects.toThrow(
			/executor count/i,
		)
		await expect(promptExecutorCount(stubReader(['-1']))).rejects.toThrow(
			/executor count/i,
		)
		await expect(promptExecutorCount(stubReader(['1.5']))).rejects.toThrow(
			/executor count/i,
		)
	})
})
