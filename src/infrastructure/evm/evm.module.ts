import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { EvmClientModule } from './evm-client/evm-client.module'
import { EvmCurrencyReadService } from './evm-currency-read.service'
import { EvmCurrencyService } from './evm-currency.service'
import { GasPriceService } from './gas-price.service'

@Module({
	imports: [EvmClientModule, CacheModule.register()],
	providers: [EvmCurrencyService, EvmCurrencyReadService, GasPriceService],
	exports: [
		EvmCurrencyService,
		EvmCurrencyReadService,
		GasPriceService,
		EvmClientModule,
	],
})
export class EvmModule {}
