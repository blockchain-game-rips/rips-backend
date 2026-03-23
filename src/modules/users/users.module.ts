import { Module } from '@nestjs/common'
import { CreateUserModule } from 'src/modules/use-cases/create-user.module'
import { GetUserModule } from 'src/modules/use-cases/get-user.module'
import { UsersController } from 'src/presentation/users/users.controller'

@Module({
	imports: [GetUserModule, CreateUserModule],
	controllers: [UsersController],
})
export class UsersModule {}
