import { Module } from '@nestjs/common'
import { CurrencyModule } from '../../../infrastructure/currency/currency.module'
import { CurrencyController } from '../../../presentation/currency/currency.controller'
import { GetPriceModule } from '../../use-cases/get-price.module'

@Module({
	imports: [CurrencyModule, GetPriceModule],
	controllers: [CurrencyController],
})
export class CurrencyApiModule {}
