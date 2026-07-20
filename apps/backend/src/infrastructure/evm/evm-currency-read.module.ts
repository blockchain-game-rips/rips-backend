import { Module } from '@nestjs/common'
import { EvmClientModule } from './evm-client/evm-client.module'
import { EvmCurrencyReadService } from './evm-currency-read.service'
import { EvmCurrencyService } from './evm-currency.service'

@Module({
	imports: [EvmClientModule],
	providers: [EvmCurrencyService, EvmCurrencyReadService],
	exports: [EvmCurrencyService, EvmCurrencyReadService, EvmClientModule],
})
export class EvmCurrencyReadModule {}
