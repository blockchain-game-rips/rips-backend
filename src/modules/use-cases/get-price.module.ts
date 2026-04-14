import { Module } from '@nestjs/common'
import { GetPriceService } from '../../application/use-cases/get-price/get-price.service'
import { GetPriceUseCase } from '../../application/use-cases/get-price/get-price.use-case'
import { PriceOracleModule } from '../../infrastructure/price-provider/price-provider.module'
import { MainCurrencyModule } from '../main-currency/main-currency.module'

@Module({
	imports: [MainCurrencyModule, PriceOracleModule],
	providers: [{ provide: GetPriceUseCase, useClass: GetPriceService }],
	exports: [GetPriceUseCase],
})
export class GetPriceModule {}
