import { Module } from '@nestjs/common'
import { UsersController } from '../../presentation/users/users.controller'
import { CreateUserModule } from '../use-cases/create-user.module'
import { GetUserModule } from '../use-cases/get-user.module'
import { SetReferrerModule } from '../use-cases/set-referrer.module'

@Module({
	imports: [GetUserModule, CreateUserModule, SetReferrerModule],
	controllers: [UsersController],
})
export class UsersModule {}
