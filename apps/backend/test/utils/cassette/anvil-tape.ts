import { Anvil, AnvilConfig } from '@rips/test-harness'
import nock from 'nock'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
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

	const replayedOrigin = replayedAnvilUrl(params.chainId)

	const fingerprint = stateFingerprint(params.pathToState)

	let started = false

	return {
		anvil,

		normalize(definition) {
			const live = liveOrigin(anvil)

			if (live === undefined || scopeOf(definition) !== live) {
				return definition
			}

			return {
				...definition,
				scope: withDefaultPort(replayedOrigin),
				path: withFingerprint(String(definition.path), fingerprint),
			}
		},

		owns: (definition) =>
			scopeOf(definition) === withDefaultPort(replayedOrigin) &&
			fingerprintOf(String(definition.path)) === fingerprint,

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

		replayed: () => ({
			rpcUrl: withFingerprint(replayedOrigin, fingerprint),
		}),
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

const STATE_PARAM = 'state'

/**
 * Pins a url to the state behind it, because a url identifies a source and the
 * source is the chain *and* what was loaded into it. Editing a contract leaves
 * the calldata of an eth_call byte for byte the same, so without this the tape
 * would keep answering for a contract that no longer exists.
 *
 * It rides in the path rather than the scope's query because nock.define()
 * keeps only the origin of a scope and drops its query, while it matches the
 * path verbatim. A fingerprint in the scope would be discarded on load and
 * every replay would miss.
 */
function withFingerprint(url: string, fingerprint?: string): string {
	return fingerprint === undefined
		? url
		: `${url}?${STATE_PARAM}=${fingerprint}`
}

/** The fingerprint a path was pinned with, if it carries one. */
function fingerprintOf(path: string): string | undefined {
	return path.split(`?${STATE_PARAM}=`)[1]
}

/**
 * Short enough to read in a `no match`, long enough that two states this repo
 * ever loads will not collide.
 */
const FINGERPRINT_LENGTH = 6

/**
 * What was loaded into anvil, as something a url can carry. A bare fork has no
 * state file, and so has nothing to pin and nothing to check.
 */
function stateFingerprint(pathToState?: string): string | undefined {
	if (pathToState === undefined) {
		return undefined
	}

	return createHash('sha256')
		.update(readFileSync(pathToState))
		.digest('hex')
		.slice(0, FINGERPRINT_LENGTH)
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
