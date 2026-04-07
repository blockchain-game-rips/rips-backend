import { Module } from '@nestjs/common'
import { BuyTicketsService } from 'src/application/use-cases/buy-tickets/buy-tickets.service'
import { BuyTicketsUseCase } from 'src/application/use-cases/buy-tickets/buy-tickets.use-case'
import { WalletModule } from 'src/infrastructure/wallet/wallet.module'
import { GetAvailableStakesModule } from './get-available-stakes.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, GetAvailableStakesModule, WalletModule],
	providers: [{ provide: BuyTicketsUseCase, useClass: BuyTicketsService }],
	exports: [BuyTicketsUseCase],
})
export class BuyTicketsModule {}
