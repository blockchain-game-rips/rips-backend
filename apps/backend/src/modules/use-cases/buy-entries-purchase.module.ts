import { Module } from '@nestjs/common'
import { BuyEntriesPurchaseService } from '../../application/use-cases/buy-entries-purchase/buy-entries-purchase.service'
import { BuyEntriesPurchaseUseCase } from '../../application/use-cases/buy-entries-purchase/buy-entries-purchase.use-case'
import { CurrencyModule } from '../../infrastructure/currency/currency.module'
import { RipsModule } from '../../infrastructure/rips/rips.module'
import { GetAvailablePresetsModule } from './get-available-presets.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [
		GetUserModule,
		GetAvailablePresetsModule,
		RipsModule,
		CurrencyModule,
	],
	providers: [
		{
			provide: BuyEntriesPurchaseUseCase,
			useClass: BuyEntriesPurchaseService,
		},
	],
	exports: [BuyEntriesPurchaseUseCase],
})
export class BuyEntriesPurchaseModule {}
