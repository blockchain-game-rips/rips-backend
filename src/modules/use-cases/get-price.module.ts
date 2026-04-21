import { Module } from '@nestjs/common'
import { GetPriceService } from '../../application/use-cases/get-price/get-price.service'
import { GetPriceUseCase } from '../../application/use-cases/get-price/get-price.use-case'
import { PriceOracleModule } from '../../infrastructure/price-provider/price-provider.module'

@Module({
	imports: [PriceOracleModule],
	providers: [{ provide: GetPriceUseCase, useClass: GetPriceService }],
	exports: [GetPriceUseCase],
})
export class GetPriceModule {}
