import { Module } from '@nestjs/common'
import { GetPriceModule } from 'src/modules/use-cases/get-price.module'
import { PriceController } from 'src/presentation/price/price.controller'

@Module({
	imports: [GetPriceModule],
	controllers: [PriceController],
})
export class PriceModule {}
