import { Module } from '@nestjs/common'
import { GetPriceService } from 'src/application/use-cases/get-price/get-price.service'
import { GetPriceUseCase } from 'src/application/use-cases/get-price/get-price.use-case'
import { PriceOracleModule } from 'src/infrastructure/price-provider/price-provider.module'
import { MainCurrencyModule } from 'src/modules/main-currency/main-currency.module'

@Module({
	imports: [MainCurrencyModule, PriceOracleModule],
	providers: [{ provide: GetPriceUseCase, useClass: GetPriceService }],
	exports: [GetPriceUseCase],
})
export class GetPriceModule {}
