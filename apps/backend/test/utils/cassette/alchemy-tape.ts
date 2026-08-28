import { readAlchemyApiKey } from '../../../src/infrastructure/evm/evm-client/alchemy/alchemy-utils'
import { Tape } from './tape'

/**
 * What stands in for the api key on tape. A replay hands this to the service,
 * which builds the very url a scrubbed recording left behind, so both sides
 * agree by construction rather than by rewriting one into the other.
 */
export const ALCHEMY_KEY_PLACEHOLDER = 'alchemy-api-key'

/** An alchemy endpoint, and the key a run reaches it with. */
export type AlchemyEndpoint = {
	readonly origin: string
	readonly apiKey: string
}

export type AlchemyTape = Tape<AlchemyEndpoint, AlchemyEndpoint>

/**
 * Tapes one alchemy origin. The key lives in the url path, so it is the tape's
 * to hand out and the tape's to keep off the recording.
 */
export function alchemyTape(origin: string): AlchemyTape {
	return {
		normalize: (definition) =>
			originOf(definition) === origin
				? { ...definition, path: scrubKey(String(definition.path)) }
				: definition,

		owns: (definition) => originOf(definition) === origin,

		// Read lazily, like anvil's port: the handle is built while the
		// describe block assembles, long before a recording run needs a key.
		recorded: () => ({
			origin,
			get apiKey() {
				return requireAlchemyApiKey()
			},
		}),

		record: async () => {},
		stop: async () => {},

		replayed: () => ({ origin, apiKey: ALCHEMY_KEY_PLACEHOLDER }),
	}
}

/** The key a recording run goes out with; there is no recording without one. */
function requireAlchemyApiKey(): string {
	const apiKey = readAlchemyApiKey()

	if (apiKey === undefined) {
		throw new Error('ALCHEMY_API_KEY is not set')
	}

	return apiKey
}

/**
 * Replaces the live key with its placeholder. Done by value rather than by url
 * shape, because the key sits in two different paths: the rpc `/v2/{key}` and
 * the portfolio `/data/v1/{key}/...`.
 */
function scrubKey(path: string): string {
	const liveKey = readAlchemyApiKey()

	return liveKey === undefined
		? path
		: path.replaceAll(liveKey, ALCHEMY_KEY_PLACEHOLDER)
}

/** nock spells a scope out with its port; an origin does not carry one. */
function originOf(definition: { scope: string | RegExp }): string {
	const { protocol, hostname } = new URL(String(definition.scope))

	return `${protocol}//${hostname}`
}
