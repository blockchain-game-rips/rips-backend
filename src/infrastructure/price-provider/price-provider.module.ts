import { Global, Module } from '@nestjs/common'
import { PRICE_PROVIDER_TOKEN } from 'src/application/interfaces/price-service'
import { EvmModule } from '../evm/evm.module'
import { GeckoTerminalService } from './gecko-terminal.service'
import { PriceProviderService } from './price-provider.service'

@Global()
@Module({
	imports: [EvmModule],
	providers: [
		GeckoTerminalService,
		PriceProviderService,
		{ provide: PRICE_PROVIDER_TOKEN, useExisting: PriceProviderService },
	],
	exports: [PRICE_PROVIDER_TOKEN],
})
export class PriceOracleModule {}
