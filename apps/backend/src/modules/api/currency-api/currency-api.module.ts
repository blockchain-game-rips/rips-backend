import { Module } from '@nestjs/common'
import { CurrencyModule } from '../../../infrastructure/currency/currency.module'
import { CurrencyController } from '../../../presentation/currency/currency.controller'

@Module({
	imports: [CurrencyModule],
	controllers: [CurrencyController],
})
export class CurrencyApiModule {}
