import { DynamicModule, Module } from '@nestjs/common'
import { PriceProvider } from '../../application/interfaces/price-service'
import { EvmCurrencyReadModule } from '../evm/evm-currency-read.module'
import {
	TOKEN_PRICE_SEED_SOURCE,
	TokenPriceSeedSource,
} from '../token-registry/token-registry.interfaces'
import { GeckoTerminalService } from './gecko-terminal.service'
import {
	PriceProviderWarmupService,
	WARMUP_CURRENCY_IDS,
} from './price-provider-warmup.service'
import { PriceProviderService } from './price-provider.service'

@Module({})
export class PriceOracleModule {
	static forRoot(): DynamicModule {
		return {
			module: PriceOracleModule,
			global: true,
			imports: [EvmCurrencyReadModule],
			providers: [
				GeckoTerminalService,
				{ provide: PriceProvider, useClass: PriceProviderService },
				{
					provide: WARMUP_CURRENCY_IDS,
					useFactory: (seedSource: TokenPriceSeedSource) =>
						Array.from(seedSource.seedPrices().keys()),
					inject: [TOKEN_PRICE_SEED_SOURCE],
				},
				PriceProviderWarmupService,
			],
			exports: [PriceProvider],
		}
	}
}
