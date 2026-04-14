import { Module } from '@nestjs/common'
import { PriceController } from '../../presentation/price/price.controller'
import { GetPriceModule } from '../use-cases/get-price.module'

@Module({
	imports: [GetPriceModule],
	controllers: [PriceController],
})
export class PriceModule {}
