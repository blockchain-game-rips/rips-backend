import { Global, Module } from '@nestjs/common'
import { PriceProvider } from 'src/application/interfaces/price-service'
import { EvmModule } from '../evm/evm.module'
import { GeckoTerminalService } from './gecko-terminal.service'
import { PriceProviderService } from './price-provider.service'

@Global()
@Module({
	imports: [EvmModule],
	providers: [
		GeckoTerminalService,
		{ provide: PriceProvider, useClass: PriceProviderService },
	],
	exports: [PriceProvider],
})
export class PriceOracleModule {}
