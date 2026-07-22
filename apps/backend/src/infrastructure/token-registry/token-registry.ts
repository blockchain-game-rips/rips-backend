import { getAddress } from 'viem'
import { CurrencyMetadata } from '../../domain/entities/currency'
import { composeChainId } from '../../domain/services/chain-id-utils'
import { composeCurrencyId } from '../../domain/services/currency-id-utils'
import { Chain } from '../../domain/value-objects/chain'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { CurrencyId } from '../../domain/value-objects/currency-id'
import { EnrichedToken } from './enriched-token'
import {
	SupportedTokens,
	TokenMetadataSource,
	TokenPriceSeedSource,
} from './token-registry.interfaces'

function currencyIdOf(chain: Chain, address: string): CurrencyId {
	return composeCurrencyId(
		composeChainId(chain.namespace, chain.reference),
		getAddress(address),
	)
}

function labelOf(entry: ChainAddress): string {
	return `${entry.chain.namespace}:${entry.chain.reference}:${entry.address}`
}

/**
 * Single source of truth for tokens the system knows. Loaded once from the
 * committed enriched artifact. Exposes narrow, segregated projections so no
 * consumer sees fields it shouldn't (e.g. price provider never sees metadata).
 */
export class TokenRegistry
	implements TokenMetadataSource, TokenPriceSeedSource, SupportedTokens
{
	private readonly byId: Map<CurrencyId, EnrichedToken>
	private readonly supportedTokens: ChainAddress[]

	constructor(tokens: EnrichedToken[], allowList: ChainAddress[]) {
		this.byId = new Map(
			tokens.map((token) => [
				currencyIdOf(token.chain, token.address),
				token,
			]),
		)

		this.supportedTokens = this.resolveAllowList(allowList)
	}

	metadataOf(id: CurrencyId): CurrencyMetadata | undefined {
		return this.byId.get(id)?.metadata
	}

	seedPrices(): Map<CurrencyId, number> {
		const prices = new Map<CurrencyId, number>()

		for (const [id, token] of this.byId) {
			prices.set(id, token.lastKnownPrice)
		}

		return prices
	}

	supported(): ChainAddress[] {
		return this.supportedTokens
	}

	/**
	 * Fails fast at startup if any allowlisted token is absent from the
	 * registry, so a request-path read can never throw.
	 */
	private resolveAllowList(allowList: ChainAddress[]): ChainAddress[] {
		const unknown = allowList.filter(
			(entry) => !this.byId.has(currencyIdOf(entry.chain, entry.address)),
		)

		if (unknown.length > 0) {
			const list = unknown.map(labelOf).join(', ')

			throw new Error(
				`Allowlisted tokens not in the enriched registry: ${list}`,
			)
		}

		return allowList.map((entry) => ({
			chain: entry.chain,
			address: getAddress(entry.address),
		}))
	}
}
