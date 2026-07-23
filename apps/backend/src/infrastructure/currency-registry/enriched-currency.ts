import z from 'zod'
import { CurrencyMetadata } from '../../domain/entities/currency'
import { Chain } from '../../domain/value-objects/chain'
import { toChainNamespace } from '../../domain/value-objects/chain-namespace'

/**
 * A single row of the enriched currency registry artifact.
 *
 * Infrastructure type — never leaves the currency-registry module. Consumers
 * receive domain-typed projections (CurrencyMetadata, Map<CurrencyId, number>,
 * Currency) instead.
 */
export interface EnrichedCurrency {
	chain: Chain
	address: string
	metadata: CurrencyMetadata
	lastKnownPrice: number
}

const chainSchema: z.ZodType<Chain> = z.object({
	namespace: z.string().transform(toChainNamespace),
	reference: z.string(),
})

const currencyMetadataSchema = z.object({
	symbol: z.string(),
	name: z.string(),
	decimals: z.number().int().nonnegative(),
})

export const enrichedCurrencySchema: z.ZodType<EnrichedCurrency> = z.object({
	chain: chainSchema,
	address: z.string(),
	metadata: currencyMetadataSchema,
	lastKnownPrice: z.number().nonnegative(),
})

export const enrichedRegistrySchema = z.array(enrichedCurrencySchema)
