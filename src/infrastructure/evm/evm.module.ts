import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { CurrencyService } from './currency.service'
import { EvmClientModule } from './evm-client/evm-client.module'
import { GasPriceService } from './gas-price.service'

@Module({
	imports: [EvmClientModule, CacheModule.register()],
	providers: [CurrencyService, GasPriceService],
	exports: [CurrencyService, GasPriceService, EvmClientModule],
})
export class EvmModule {}
