import { Module } from '@nestjs/common'
import { CurrencyService } from '../../application/interfaces/currency.service'
import { CurrencyServiceImpl } from '../../infrastructure/currency/currency.service'
import { EvmModule } from '../../infrastructure/evm/evm.module'

@Module({
	imports: [EvmModule],
	providers: [{ provide: CurrencyService, useClass: CurrencyServiceImpl }],
	exports: [CurrencyService],
})
export class CurrencyModule {}
