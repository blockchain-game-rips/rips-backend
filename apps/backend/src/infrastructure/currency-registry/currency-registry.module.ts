import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
	SUPPORTED_CURRENCIES_KEY,
	SupportedCurrenciesSchema,
} from '../../configuration/configuration'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { toChainNamespace } from '../../domain/value-objects/chain-namespace'
import { CurrencyRegistry } from './currency-registry'
import {
	CURRENCY_METADATA_SOURCE,
	CURRENCY_PRICE_SEED_SOURCE,
	SUPPORTED_CURRENCIES,
} from './currency-registry.interfaces'
import { loadEnrichedRegistry } from './enriched-registry-loader'

function toAllowList(configService?: ConfigService): ChainAddress[] {
	const raw: unknown = configService?.get(SUPPORTED_CURRENCIES_KEY)

	const entries = SupportedCurrenciesSchema.parse(raw)

	return entries.map((entry) => ({
		chain: {
			namespace: toChainNamespace(entry.chain.namespace),
			reference: entry.chain.reference,
		},
		address: entry.address,
	}))
}

const currencyRegistryProvider = {
	provide: CurrencyRegistry,
	useFactory: (configService?: ConfigService): CurrencyRegistry => {
		const currencies = loadEnrichedRegistry()
		const allowList = toAllowList(configService)

		return new CurrencyRegistry(currencies, allowList)
	},
	inject: [{ token: ConfigService, optional: true }],
}

@Global()
@Module({
	providers: [
		currencyRegistryProvider,
		{ provide: CURRENCY_METADATA_SOURCE, useExisting: CurrencyRegistry },
		{ provide: CURRENCY_PRICE_SEED_SOURCE, useExisting: CurrencyRegistry },
		{ provide: SUPPORTED_CURRENCIES, useExisting: CurrencyRegistry },
	],
	exports: [
		CURRENCY_METADATA_SOURCE,
		CURRENCY_PRICE_SEED_SOURCE,
		SUPPORTED_CURRENCIES,
	],
})
export class CurrencyRegistryModule {}
