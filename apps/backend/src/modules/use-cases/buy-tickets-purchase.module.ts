import { Module } from '@nestjs/common'
import { BuyTicketsPurchaseService } from '../../application/use-cases/buy-tickets-purchase/buy-tickets-purchase.service'
import { BuyTicketsPurchaseUseCase } from '../../application/use-cases/buy-tickets-purchase/buy-tickets-purchase.use-case'
import { CurrencyModule } from '../../infrastructure/currency/currency.module'
import { RipsModule } from '../../infrastructure/rips/rips.module'
import { GetAvailableStakesModule } from './get-available-stakes.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [
		GetUserModule,
		GetAvailableStakesModule,
		RipsModule,
		CurrencyModule,
	],
	providers: [
		{
			provide: BuyTicketsPurchaseUseCase,
			useClass: BuyTicketsPurchaseService,
		},
	],
	exports: [BuyTicketsPurchaseUseCase],
})
export class BuyTicketsPurchaseModule {}
