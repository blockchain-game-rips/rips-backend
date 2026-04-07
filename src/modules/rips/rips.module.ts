import { Module } from '@nestjs/common'
import { BuyTicketsModule } from 'src/modules/use-cases/buy-tickets.module'
import { GetAvailableStakesModule } from 'src/modules/use-cases/get-available-stakes.module'
import { GetCompletedRoundsModule } from 'src/modules/use-cases/get-completed-rounds.module'
import { GetOngoingRoundsModule } from 'src/modules/use-cases/get-ongoing-rounds.module'
import { GetUserModule } from 'src/modules/use-cases/get-user.module'
import { RipsController } from 'src/presentation/rips/rips.controller'

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
export class RipsModule {}
