import { Module } from '@nestjs/common'
import { USER_REPOSITORY_TOKEN } from 'src/application/interfaces/repositories/user.repository'
import { CreateUserService } from 'src/application/use-cases/create-user/create-user.service'
import { CREATE_USER_USE_CASE_TOKEN } from 'src/application/use-cases/create-user/create-user.use-case'
import { GetUserService } from 'src/application/use-cases/get-user/get-user.service'
import { GET_USER_USE_CASE_TOKEN } from 'src/application/use-cases/get-user/get-user.use-case'
import { KmsModule } from 'src/infrastructure/kms/kms.module'
import { PrismaUserRepository } from 'src/infrastructure/prisma/user.repository'
import { UsersController } from 'src/presentation/users/users.controller'

@Module({
	imports: [KmsModule],
	controllers: [UsersController],
	providers: [
		PrismaUserRepository,
		{ provide: USER_REPOSITORY_TOKEN, useExisting: PrismaUserRepository },
		GetUserService,
		{ provide: GET_USER_USE_CASE_TOKEN, useExisting: GetUserService },
		CreateUserService,
		{ provide: CREATE_USER_USE_CASE_TOKEN, useExisting: CreateUserService },
	],
})
export class UsersModule {}
