import { Module } from '@nestjs/common'
import { RipsController } from '../../presentation/rips/rips.controller'
import { BuyTicketsModule } from '../use-cases/buy-tickets.module'
import { GetAvailableStakesModule } from '../use-cases/get-available-stakes.module'
import { GetCompletedRoundsModule } from '../use-cases/get-completed-rounds.module'
import { GetOngoingRoundsModule } from '../use-cases/get-ongoing-rounds.module'
import { GetPriceModule } from '../use-cases/get-price.module'
import { GetUserModule } from '../use-cases/get-user.module'

@Module({
	imports: [
		GetUserModule,
		GetAvailableStakesModule,
		GetOngoingRoundsModule,
		GetCompletedRoundsModule,
		BuyTicketsModule,
		GetPriceModule,
	],
	controllers: [RipsController],
})
export class RipsApiModule {}
