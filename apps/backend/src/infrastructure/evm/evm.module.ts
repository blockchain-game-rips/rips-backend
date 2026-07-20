import { Module } from '@nestjs/common'
import { EvmCurrencyReadModule } from './evm-currency-read.module'
import { EvmCurrencyWriteModule } from './evm-currency-write.module'

@Module({
	imports: [EvmCurrencyReadModule, EvmCurrencyWriteModule],
	exports: [EvmCurrencyReadModule, EvmCurrencyWriteModule],
})
export class EvmModule {}
