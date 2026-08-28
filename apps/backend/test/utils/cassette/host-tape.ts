import { alchemyTape } from './alchemy-tape'
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
const GECKO_TERMINAL_ORIGIN = 'https://api.geckoterminal.com'

// de-bridge splits its api across three hosts: quotes and swaps on one, order
// lookups on another, and a dln alias for the first.
const DE_BRIDGE_SWAP_ORIGIN = 'https://dln.debridge.finance'
const DE_BRIDGE_ORDERS_ORIGIN = 'https://dln-api.debridge.finance'
const DE_BRIDGE_DLN_ORIGIN = 'https://api.dln.trade'

// Alchemy answers on a host per chain, plus one for the portfolio api. An
// origin has to be spelled out, so every chain a test touches needs its own.
const ALCHEMY_BASE_ORIGIN = 'https://base-mainnet.g.alchemy.com'
const ALCHEMY_ETHEREUM_ORIGIN = 'https://eth-mainnet.g.alchemy.com'
const ALCHEMY_PORTFOLIO_ORIGIN = 'https://api.g.alchemy.com'

/**
 * Every external API the backend talks to, so that a test names none of them
 * itself. Anything absent here is neither recorded nor matched, which keeps the
 * infrastructure that also speaks HTTP — the Docker API over its unix socket,
 * which Node reports as `localhost:80` — out of view entirely, rather than
 * filtered back out after the fact.
 */
export function externalTapes() {
	return {
		liFi: hostTape(LI_FI_ORIGIN),
		deBridgeSwap: hostTape(DE_BRIDGE_SWAP_ORIGIN),
		deBridgeOrders: hostTape(DE_BRIDGE_ORDERS_ORIGIN),
		deBridgeDln: hostTape(DE_BRIDGE_DLN_ORIGIN),
		geckoTerminal: hostTape(GECKO_TERMINAL_ORIGIN),
		alchemyBase: alchemyTape(ALCHEMY_BASE_ORIGIN),
		alchemyEthereum: alchemyTape(ALCHEMY_ETHEREUM_ORIGIN),
		alchemyPortfolio: alchemyTape(ALCHEMY_PORTFOLIO_ORIGIN),
	}
}
