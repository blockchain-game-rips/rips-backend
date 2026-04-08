import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { SignModule } from '../sign/sign.module'
import { EvmClientModule } from './evm-client/evm-client.module'
import { EvmCurrencyReadService } from './evm-currency-read.service'
import { EvmCurrencyWriteService } from './evm-currency-write.service'
import { EvmCurrencyService } from './evm-currency.service'
import { EvmTransactionService } from './evm-transaction.service'
import { GasPriceService } from './gas-price.service'

@Module({
	imports: [EvmClientModule, CacheModule.register(), SignModule],
	providers: [
		EvmCurrencyService,
		EvmCurrencyReadService,
		EvmCurrencyWriteService,
		EvmTransactionService,
		GasPriceService,
	],
	exports: [
		EvmCurrencyService,
		EvmCurrencyReadService,
		EvmCurrencyWriteService,
		EvmTransactionService,
		GasPriceService,
		EvmClientModule,
	],
})
export class EvmModule {}
