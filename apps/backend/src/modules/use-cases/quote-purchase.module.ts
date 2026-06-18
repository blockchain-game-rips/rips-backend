import { Module } from '@nestjs/common'
import { QuotePurchaseService } from '../../application/use-cases/quote-purchase/quote-purchase.service'
import { QuotePurchaseUseCase } from '../../application/use-cases/quote-purchase/quote-purchase.use-case'
import { CurrencyModule } from '../../infrastructure/currency/currency.module'
import { RipsModule } from '../../infrastructure/rips/rips.module'
import { GetAvailableStakesModule } from './get-available-stakes.module'

@Module({
	imports: [GetAvailableStakesModule, CurrencyModule, RipsModule],
	providers: [
		{ provide: QuotePurchaseUseCase, useClass: QuotePurchaseService },
	],
	exports: [QuotePurchaseUseCase],
})
export class QuotePurchaseModule {}
