import { Module } from '@nestjs/common'
import { RipsController } from '../../presentation/rips/rips.controller'
import { BuyTicketsModule } from '../use-cases/buy-tickets.module'
import { GetAvailableStakesModule } from '../use-cases/get-available-stakes.module'
import { GetCompletedRoundsModule } from '../use-cases/get-completed-rounds.module'
import { GetOngoingRoundsModule } from '../use-cases/get-ongoing-rounds.module'
import { GetUserModule } from '../use-cases/get-user.module'

@Module({
	imports: [
		GetUserModule,
		GetAvailableStakesModule,
		GetOngoingRoundsModule,
		GetCompletedRoundsModule,
		BuyTicketsModule,
	],
	controllers: [RipsController],
})
//TODO: bad naming, there is also RipsInfraModule
export class RipsModule {}
