import { Module } from '@nestjs/common'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { CreateUserService } from 'src/application/use-cases/create-user/create-user.service'
import { CreateUserUseCase } from 'src/application/use-cases/create-user/create-user.use-case'
import { GetUserService } from 'src/application/use-cases/get-user/get-user.service'
import { GetUserUseCase } from 'src/application/use-cases/get-user/get-user.use-case'
import { KmsModule } from 'src/infrastructure/kms/kms.module'
import { PrismaUserRepository } from 'src/infrastructure/prisma/user.repository'
import { UsersController } from 'src/presentation/users/users.controller'

@Module({
	imports: [KmsModule],
	controllers: [UsersController],
	providers: [
		{ provide: UserRepository, useClass: PrismaUserRepository },
		{ provide: GetUserUseCase, useClass: GetUserService },
		{ provide: CreateUserUseCase, useClass: CreateUserService },
	],
})
export class UsersModule {}
