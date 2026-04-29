import { Module } from '@nestjs/common'
import { CurrencyController } from '../../presentation/currency/currency.controller'
import { GetPriceModule } from '../use-cases/get-price.module'
import { CurrencyModule } from './currency.module'

@Module({
	imports: [CurrencyModule, GetPriceModule],
	controllers: [CurrencyController],
})
export class CurrencyApiModule {}
