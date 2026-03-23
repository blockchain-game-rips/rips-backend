import { Module } from '@nestjs/common'
import { CurrencyService } from 'src/application/interfaces/currency.service'
import { MAIN_CURRENCY } from 'src/application/interfaces/tokens'
import { CurrencyServiceImpl } from 'src/infrastructure/currency/currency.service'
import { EvmModule } from 'src/infrastructure/evm/evm.module'
import { MAIN_CURRENCY_VALUE } from './main-currency.constants'

@Module({
	imports: [EvmModule],
	providers: [
		{ provide: CurrencyService, useClass: CurrencyServiceImpl },
		{
			provide: MAIN_CURRENCY,
			useFactory: async (currencyService: CurrencyService) =>
				currencyService.fromAccount(MAIN_CURRENCY_VALUE),
			inject: [CurrencyService],
		},
	],
	exports: [CurrencyService, MAIN_CURRENCY],
})
export class MainCurrencyModule {}
