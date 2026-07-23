import { CurrencyMetadata } from '../../domain/entities/currency'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { CurrencyId } from '../../domain/value-objects/currency-id'

export const CURRENCY_METADATA_SOURCE = Symbol('CURRENCY_METADATA_SOURCE')
export const CURRENCY_PRICE_SEED_SOURCE = Symbol('CURRENCY_PRICE_SEED_SOURCE')
export const SUPPORTED_CURRENCIES = Symbol('SUPPORTED_CURRENCIES')

/**
 * Warm metadata cache for evm-currency. A miss means the caller falls back to
 * an on-chain read — the registry is never a gate.
 */
export interface CurrencyMetadataSource {
	metadataOf(id: CurrencyId): CurrencyMetadata | undefined
}

/**
 * Cold-start price seed for the price provider. Live refresh overwrites these.
 */
export interface CurrencyPriceSeedSource {
	seedPrices(): Map<CurrencyId, number>
}

/**
 * The advisory set of currencies this deployment offers — enriched registry
 * intersected with the config allowlist, resolved once at startup.
 */
export interface SupportedCurrencies {
	supported(): ChainAddress[]
}
