import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { SignModule } from '../sign/sign.module'
import { EvmClientModule } from './evm-client/evm-client.module'
import { EvmCurrencyReadService } from './evm-currency-read.service'
import { EvmCurrencyWriteService } from './evm-currency-write.service'
import { EvmCurrencyService } from './evm-currency.service'
import { GasPriceService } from './gas-price.service'

@Module({
	imports: [EvmClientModule, CacheModule.register(), SignModule],
	providers: [
		EvmCurrencyService,
		EvmCurrencyReadService,
		EvmCurrencyWriteService,
		GasPriceService,
	],
	exports: [
		EvmCurrencyService,
		EvmCurrencyReadService,
		EvmCurrencyWriteService,
		GasPriceService,
		EvmClientModule,
	],
})
export class EvmModule {}
