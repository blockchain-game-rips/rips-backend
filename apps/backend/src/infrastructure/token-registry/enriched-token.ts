import z from 'zod'
import { CurrencyMetadata } from '../../domain/entities/currency'
import { Chain } from '../../domain/value-objects/chain'
import { toChainNamespace } from '../../domain/value-objects/chain-namespace'

/**
 * A single row of the enriched token registry artifact.
 *
 * Infrastructure type — never leaves the token-registry module. Consumers
 * receive domain-typed projections (CurrencyMetadata, Map<CurrencyId, number>,
 * Currency) instead.
 */
export interface EnrichedToken {
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

export const enrichedTokenSchema: z.ZodType<EnrichedToken> = z.object({
	chain: chainSchema,
	address: z.string(),
	metadata: currencyMetadataSchema,
	lastKnownPrice: z.number().nonnegative(),
})

export const enrichedRegistrySchema = z.array(enrichedTokenSchema)
