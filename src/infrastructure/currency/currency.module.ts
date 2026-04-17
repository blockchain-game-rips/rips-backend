import { Module } from '@nestjs/common'
import { CurrencyService } from '../../application/interfaces/currency.service'
import { EvmModule } from '../evm/evm.module'
import { CurrencyServiceImpl } from './currency.service'

@Module({
	imports: [EvmModule],
	providers: [{ provide: CurrencyService, useClass: CurrencyServiceImpl }],
	exports: [CurrencyService],
})
export class CurrencyModule {}
