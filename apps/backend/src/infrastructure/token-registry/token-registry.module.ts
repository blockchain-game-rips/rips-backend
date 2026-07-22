import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
	SUPPORTED_TOKENS_KEY,
	SupportedTokensSchema,
} from '../../configuration/configuration'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { toChainNamespace } from '../../domain/value-objects/chain-namespace'
import { loadEnrichedRegistry } from './enriched-registry-loader'
import { TokenRegistry } from './token-registry'
import {
	SUPPORTED_TOKENS,
	TOKEN_METADATA_SOURCE,
	TOKEN_PRICE_SEED_SOURCE,
} from './token-registry.interfaces'

function toAllowList(configService?: ConfigService): ChainAddress[] {
	const raw: unknown = configService?.get(SUPPORTED_TOKENS_KEY)

	const entries = SupportedTokensSchema.parse(raw)

	return entries.map((entry) => ({
		chain: {
			namespace: toChainNamespace(entry.chain.namespace),
			reference: entry.chain.reference,
		},
		address: entry.address,
	}))
}

const tokenRegistryProvider = {
	provide: TokenRegistry,
	useFactory: (configService?: ConfigService): TokenRegistry => {
		const tokens = loadEnrichedRegistry()
		const allowList = toAllowList(configService)

		return new TokenRegistry(tokens, allowList)
	},
	inject: [{ token: ConfigService, optional: true }],
}

@Global()
@Module({
	providers: [
		tokenRegistryProvider,
		{ provide: TOKEN_METADATA_SOURCE, useExisting: TokenRegistry },
		{ provide: TOKEN_PRICE_SEED_SOURCE, useExisting: TokenRegistry },
		{ provide: SUPPORTED_TOKENS, useExisting: TokenRegistry },
	],
	exports: [TOKEN_METADATA_SOURCE, TOKEN_PRICE_SEED_SOURCE, SUPPORTED_TOKENS],
})
export class TokenRegistryModule {}
