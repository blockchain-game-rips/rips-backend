import { Module } from '@nestjs/common'
import { UsersController } from '../../presentation/users/users.controller'
import { CreateUserModule } from '../use-cases/create-user.module'
import { GetUnrevealedPrizesModule } from '../use-cases/get-unrevealed-prizes.module'
import { GetUserModule } from '../use-cases/get-user.module'
import { RevealTicketPrizesModule } from '../use-cases/reveal-ticket-prizes.module'

@Module({
	imports: [
		GetUserModule,
		CreateUserModule,
		RevealTicketPrizesModule,
		GetUnrevealedPrizesModule,
	],
	controllers: [UsersController],
})
export class UsersModule {}
