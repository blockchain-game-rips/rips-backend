import { Module } from '@nestjs/common'
import { BuyTicketsZapService } from '../../application/use-cases/buy-tickets-zap/buy-tickets-zap.service'
import { BuyTicketsZapUseCase } from '../../application/use-cases/buy-tickets-zap/buy-tickets-zap.use-case'
import { CurrencyModule } from '../../infrastructure/currency/currency.module'
import { DeBridgeModule } from '../../infrastructure/de-bridge/de-bridge.module'
import { GetAvailableStakesModule } from './get-available-stakes.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [
		GetUserModule,
		GetAvailableStakesModule,
		CurrencyModule,
		DeBridgeModule,
	],
	providers: [
		{ provide: BuyTicketsZapUseCase, useClass: BuyTicketsZapService },
	],
	exports: [BuyTicketsZapUseCase],
})
export class BuyTicketsZapModule {}
