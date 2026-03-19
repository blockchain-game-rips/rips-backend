import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { EvmClientModule } from './evm-client/evm-client.module'
import { EvmCurrencyService } from './evm-currency.service'
import { GasPriceService } from './gas-price.service'

@Module({
	imports: [EvmClientModule, CacheModule.register()],
	providers: [EvmCurrencyService, GasPriceService],
	exports: [EvmCurrencyService, GasPriceService, EvmClientModule],
})
export class EvmModule {}
