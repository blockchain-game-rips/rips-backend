/**
 * Prints anvil's own log when the wrapped call fails, which is the only place
 * a revert reason lives.
 *
 * Takes the log rather than the anvil, so that a replay — where no process ran
 * and there is nothing to print — cannot reach this at all: its handle has no
 * logs on it, and the type says so.
 */
export async function withAnvilTraces<T>(
	traces: () => string,
	run: () => Promise<T>,
): Promise<T> {
	return run().catch((error: unknown) => {
		console.log(traces())

		throw error
	})
}
