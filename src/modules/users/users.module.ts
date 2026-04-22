import { Module } from '@nestjs/common'
import { UsersController } from '../../presentation/users/users.controller'
import { CreateUserModule } from '../use-cases/create-user.module'
import { GetUserModule } from '../use-cases/get-user.module'

@Module({
	imports: [GetUserModule, CreateUserModule],
	controllers: [UsersController],
})
export class UsersModule {}
