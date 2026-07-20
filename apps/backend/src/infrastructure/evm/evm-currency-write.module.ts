import { Module } from '@nestjs/common'
import { SignModule } from '../sign/sign.module'
import { EvmCurrencyReadModule } from './evm-currency-read.module'
import { EvmCurrencyWriteService } from './evm-currency-write.service'
import { EvmTransactionService } from './evm-transaction.service'
import { GasPriceService } from './gas-price.service'

@Module({
	imports: [EvmCurrencyReadModule, SignModule],
	providers: [
		EvmCurrencyWriteService,
		EvmTransactionService,
		GasPriceService,
	],
	exports: [EvmCurrencyWriteService, EvmTransactionService, GasPriceService],
})
export class EvmCurrencyWriteModule {}
