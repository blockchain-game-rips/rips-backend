import { Module } from '@nestjs/common'
import { UsersController } from '../../../presentation/users/users.controller'
import { CreateUserModule } from '../../use-cases/create-user.module'
import { ExportKeyModule } from '../../use-cases/export-key.module'
import { GetUserModule } from '../../use-cases/get-user.module'
import { SetReferrerModule } from '../../use-cases/set-referrer.module'

@Module({
	imports: [
		GetUserModule,
		CreateUserModule,
		SetReferrerModule,
		ExportKeyModule,
	],
	controllers: [UsersController],
})
export class UsersApiModule {}
