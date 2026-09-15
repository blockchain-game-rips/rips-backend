import { createInterface } from 'readline/promises'
import { Writable } from 'stream'

export const DEFAULT_EXECUTOR_COUNT = 2

/**
 * The two ways setup asks for an input. Hidden reads never echo, so the admin
 * private key stays out of the terminal scrollback; everything else is typed in
 * the open. Kept as an interface so the prompts can be tested without a TTY.
 */
export type PromptReader = {
	question(query: string): Promise<string>
	questionHidden(query: string): Promise<string>
}

export async function promptPrivateKey(reader: PromptReader): Promise<string> {
	const answer = await reader.questionHidden('Admin private key: ')

	const privateKey = answer.trim()

	if (privateKey.length === 0) {
		throw new Error('Admin private key is required.')
	}

	return privateKey
}

export async function promptExecutorCount(
	reader: PromptReader,
): Promise<number> {
	const answer = await reader.question(
		`Executor count [${DEFAULT_EXECUTOR_COUNT}]: `,
	)

	const trimmed = answer.trim()

	if (trimmed.length === 0) {
		return DEFAULT_EXECUTOR_COUNT
	}

	const count = Number(trimmed)

	if (!Number.isInteger(count) || count <= 0) {
		throw new Error(
			`Executor count must be a positive integer, got "${trimmed}".`,
		)
	}

	return count
}

export type TerminalReader = PromptReader & { close(): void }

/**
 * Readline echoes whatever it reads to the output stream it was given, and has
 * no hidden-input mode of its own. Rather than reach into its internals, this
 * hands it an output stream that can be silenced: the prompt itself is written
 * directly, then echo is suppressed for the duration of the answer.
 *
 * A once-ever procedure does not justify pulling in a prompt library for this.
 */
export function createTerminalReader(): TerminalReader {
	let echoing = true

	const output = new Writable({
		write(chunk, _encoding, callback) {
			if (echoing) {
				process.stdout.write(chunk)
			}

			callback()
		},
	})

	const rl = createInterface({
		input: process.stdin,
		output,
		terminal: true,
	})

	return {
		question: (query: string) => rl.question(query),

		questionHidden: async (query: string) => {
			process.stdout.write(query)

			echoing = false

			try {
				return await rl.question('')
			} finally {
				echoing = true

				process.stdout.write('\n')
			}
		},

		close: () => rl.close(),
	}
}
