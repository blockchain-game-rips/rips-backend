import { Anvil, AnvilConfig } from '@rips/test-harness'
import nock from 'nock'
import { Tape } from './tape'

/** A live anvil: a real process, so it has logs to explain a revert with. */
export type RecordedAnvil = {
	readonly rpcUrl: string
	readonly logs: string
}

/** A replayed anvil: an address, with the tape answering behind it. */
export type ReplayedAnvil = {
	readonly rpcUrl: string
}

export type AnvilTape = Tape<RecordedAnvil, ReplayedAnvil> & {
	/** Exposed for tests that need to drive the process itself. */
	readonly anvil: Anvil
}

/**
 * Tapes one anvil: runs a real one while recording, and stands in for it with
 * nothing but an address on replay, where its traffic comes off the tape.
 *
 * Both modes hand the test the same `rpcUrl`, so a spec never learns which of
 * the two it got.
 */
export function anvilTape(params: AnvilConfig): AnvilTape {
	const anvil = new Anvil(params)

	const replayedUrl = replayedAnvilUrl(params.chainId)

	let started = false

	return {
		anvil,

		normalize(definition) {
			const live = liveOrigin(anvil)

			if (live === undefined || scopeOf(definition) !== live) {
				return definition
			}

			return { ...definition, scope: withDefaultPort(replayedUrl) }
		},

		owns: (definition) =>
			scopeOf(definition) === withDefaultPort(replayedUrl),

		recorded: () => ({
			// Read through to the process rather than copied, so the address
			// cannot drift from the port anvil actually bound.
			get rpcUrl() {
				return `http://127.0.0.1:${anvil.port}`
			},
			get logs() {
				return anvil.logs
			},
		}),

		record: async () => {
			await anvil.start()

			started = true
		},

		// Teardown runs even when the run died before anvil came up, and
		// throwing here would bury that failure under one about cleanup.
		stop: async () => {
			if (started) {
				anvil.stop()
			}
		},

		replayed: () => ({ rpcUrl: replayedUrl }),
	}
}

/**
 * Where anvil is listening, or undefined when it never got that far.
 *
 * A recording run that died before anvil bound a port still reaches teardown,
 * and asking the process for a port it never had would throw from cleanup,
 * burying the failure that actually mattered.
 */
function liveOrigin(anvil: Anvil): string | undefined {
	try {
		return `http://127.0.0.1:${anvil.port}`
	} catch {
		return undefined
	}
}

/**
 * The address a replayed anvil answers on. It carries the chain id because
 * de-bridge brings up two chains at once, and a shared host would merge their
 * traffic into one indistinguishable pile.
 */
function replayedAnvilUrl(chainId: number): string {
	return `http://anvil-${chainId}`
}

// nock records a scope with its port spelled out, so a rewrite target has to
// carry one for the two to compare equal.
const DEFAULT_HTTP_PORT = 80

function withDefaultPort(origin: string): string {
	return `${origin}:${DEFAULT_HTTP_PORT}`
}

function scopeOf(definition: nock.Definition): string {
	return String(definition.scope)
}
