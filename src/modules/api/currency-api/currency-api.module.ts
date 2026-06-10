import { Module } from '@nestjs/common'
import { CurrencyModule } from '../../../infrastructure/currency/currency.module'
import { KNOWN_TOKENS } from '../../../infrastructure/evm/primitives/currencies/constants'
import { PriceOracleModule } from '../../../infrastructure/price-provider/price-provider.module'
import { CurrencyController } from '../../../presentation/currency/currency.controller'

@Module({
	imports: [
		CurrencyModule,
		PriceOracleModule.forRoot(Array.from(KNOWN_TOKENS.keys())),
	],
	controllers: [CurrencyController],
})
export class CurrencyApiModule {}
