import { Module } from '@nestjs/common'
import { BuyTicketsService } from '../../application/use-cases/buy-tickets/buy-tickets.service'
import { BuyTicketsUseCase } from '../../application/use-cases/buy-tickets/buy-tickets.use-case'
import { CurrencyModule } from '../../infrastructure/currency/currency.module'
import { DeBridgeModule } from '../../infrastructure/de-bridge/de-bridge.module'
import { RipsModule } from '../../infrastructure/rips/rips.module'
import { WalletModule } from '../../infrastructure/wallet/wallet.module'
import { GetAvailableStakesModule } from './get-available-stakes.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [
		GetUserModule,
		GetAvailableStakesModule,
		WalletModule,
		RipsModule,
		CurrencyModule,
		DeBridgeModule,
	],
	providers: [{ provide: BuyTicketsUseCase, useClass: BuyTicketsService }],
	exports: [BuyTicketsUseCase],
})
export class BuyTicketsModule {}
