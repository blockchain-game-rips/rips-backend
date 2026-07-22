import { CurrencyMetadata } from '../../domain/entities/currency'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { CurrencyId } from '../../domain/value-objects/currency-id'

export const TOKEN_METADATA_SOURCE = Symbol('TOKEN_METADATA_SOURCE')
export const TOKEN_PRICE_SEED_SOURCE = Symbol('TOKEN_PRICE_SEED_SOURCE')
export const SUPPORTED_TOKENS = Symbol('SUPPORTED_TOKENS')

/**
 * Warm metadata cache for evm-currency. A miss means the caller falls back to
 * an on-chain read — the registry is never a gate.
 */
export interface TokenMetadataSource {
	metadataOf(id: CurrencyId): CurrencyMetadata | undefined
}

/**
 * Cold-start price seed for the price provider. Live refresh overwrites these.
 */
export interface TokenPriceSeedSource {
	seedPrices(): Map<CurrencyId, number>
}

/**
 * The advisory set of tokens this deployment offers — enriched registry
 * intersected with the config allowlist, resolved once at startup.
 */
export interface SupportedTokens {
	supported(): ChainAddress[]
}
