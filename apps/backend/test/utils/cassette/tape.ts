import nock from 'nock'

/**
 * Something whose outgoing HTTP a run can put on tape.
 *
 * A tape owns everything about the thing it records: where it lives, what
 * about it changes between runs, and — where there is one — the process behind
 * it. The VCR only ever asks; it never learns what it is holding.
 *
 * `Recorded` is the handle a recording run hands the test, `Replayed` the one a
 * replay hands it. A plain host uses the same type for both. An anvil does not,
 * because only one of the two has a process, and so only one of the two has
 * logs to show for it.
 */
export type Tape<Recorded = unknown, Replayed = unknown> = {
	/**
	 * Strips whatever differs between runs without changing what a request
	 * means, such as the random port anvil happened to bind.
	 *
	 * Recording only: a replay never needs it, because `replayed()` hands the
	 * test an already-normalized handle and the live request is built from
	 * that. Both sides therefore agree by construction rather than by running
	 * the same rewrite twice.
	 */
	normalize(definition: nock.Definition): nock.Definition

	/**
	 * Whether an interaction belongs to this tape, asked after normalize() has
	 * run: what is on the tape is the normalized form, not the live one.
	 */
	owns(definition: nock.Definition): boolean

	/**
	 * The handle a recording run hands the test. Produced while the describe
	 * block is still assembling, so anything it exposes that depends on a
	 * running process has to resolve lazily.
	 */
	recorded(): Recorded

	/** Brings up whatever that handle points at. */
	record(): Promise<void>

	/** Tears down what record() brought up, whether or not it got that far. */
	stop(): Promise<void>

	/** The stand-in a replay hands the test; nothing is brought up. */
	replayed(): Replayed
}

export type Tapes = Record<string, Tape>

/** Whether a recorded value is an interaction nock can replay. */
export function isDefinition(candidate: unknown): candidate is nock.Definition {
	return (
		typeof candidate === 'object' &&
		candidate !== null &&
		'scope' in candidate &&
		typeof candidate.scope === 'string'
	)
}
