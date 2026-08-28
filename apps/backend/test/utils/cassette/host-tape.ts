import { Tape } from './tape'

/**
 * An external API. It has no process behind it and nothing about it drifts
 * between runs, so both modes hand the test the same thing and neither brings
 * anything up.
 */
export type Host = {
	readonly origin: string
}

export type HostTape = Tape<Host, Host>

export function hostTape(origin: string): HostTape {
	const host: Host = { origin }

	return {
		normalize: (definition) => definition,

		owns: (definition) => originOf(definition) === origin,

		recorded: () => host,
		record: async () => {},
		stop: async () => {},

		replayed: () => host,
	}
}

/** nock spells a scope out with its port; an origin does not carry one. */
function originOf(definition: { scope: string | RegExp }): string {
	const { protocol, hostname } = new URL(String(definition.scope))

	return `${protocol}//${hostname}`
}

const LI_FI_ORIGIN = 'https://li.quest'
const DE_BRIDGE_ORIGIN = 'https://dln.debridge.finance'
const GECKO_TERMINAL_ORIGIN = 'https://api.geckoterminal.com'
const ALCHEMY_ORIGIN = 'https://base-mainnet.g.alchemy.com'

/**
 * Every external API the backend talks to, so that a test names none of them
 * itself. Anything absent here is neither recorded nor matched, which keeps the
 * infrastructure that also speaks HTTP — the Docker API over its unix socket,
 * which Node reports as `localhost:80` — out of view entirely, rather than
 * filtered back out after the fact.
 */
export function externalTapes(): Record<string, HostTape> {
	return {
		liFi: hostTape(LI_FI_ORIGIN),
		deBridge: hostTape(DE_BRIDGE_ORIGIN),
		geckoTerminal: hostTape(GECKO_TERMINAL_ORIGIN),
		alchemy: hostTape(ALCHEMY_ORIGIN),
	}
}
