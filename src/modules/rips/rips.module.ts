import { Module } from '@nestjs/common'
import { BuyTicketsModule } from 'src/modules/use-cases/buy-tickets.module'
import { GetRoundsModule } from 'src/modules/use-cases/get-rounds.module'
import { GetStakesModule } from 'src/modules/use-cases/get-stakes.module'
import { GetUserModule } from 'src/modules/use-cases/get-user.module'
import { RipsController } from 'src/presentation/rips/rips.controller'

@Module({
	imports: [GetUserModule, GetStakesModule, GetRoundsModule, BuyTicketsModule],
	controllers: [RipsController],
})
export class RipsModule {}
