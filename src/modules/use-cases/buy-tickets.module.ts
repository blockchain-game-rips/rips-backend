import { Module } from '@nestjs/common'
import { BuyTicketsService } from '../../application/use-cases/buy-tickets/buy-tickets.service'
import { BuyTicketsUseCase } from '../../application/use-cases/buy-tickets/buy-tickets.use-case'
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
	],
	providers: [{ provide: BuyTicketsUseCase, useClass: BuyTicketsService }],
	exports: [BuyTicketsUseCase],
})
export class BuyTicketsModule {}
