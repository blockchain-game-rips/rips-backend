import { Module } from '@nestjs/common'
import { CurrencyController } from '../../presentation/currency/currency.controller'
import { CurrencyModule } from './currency.module'

@Module({
	imports: [CurrencyModule],
	controllers: [CurrencyController],
})
export class CurrencyApiModule {}
