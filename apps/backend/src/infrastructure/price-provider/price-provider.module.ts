import { DynamicModule, Module } from '@nestjs/common'
import { PriceProvider } from '../../application/interfaces/price-service'
import { CurrencyId } from '../../domain/value-objects/currency-id'
import { EvmCurrencyReadModule } from '../evm/evm-currency-read.module'
import { GeckoTerminalService } from './gecko-terminal.service'
import {
	PriceProviderWarmupService,
	WARMUP_CURRENCY_IDS,
} from './price-provider-warmup.service'
import { PriceProviderService } from './price-provider.service'

@Module({})
export class PriceOracleModule {
	static forRoot(warmupCurrencyIds: CurrencyId[]): DynamicModule {
		return {
			module: PriceOracleModule,
			global: true,
			imports: [EvmCurrencyReadModule],
			providers: [
				GeckoTerminalService,
				{ provide: PriceProvider, useClass: PriceProviderService },
				{ provide: WARMUP_CURRENCY_IDS, useValue: warmupCurrencyIds },
				PriceProviderWarmupService,
			],
			exports: [PriceProvider],
		}
	}
}
