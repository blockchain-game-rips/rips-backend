import { Module } from '@nestjs/common'
import { CreateUserService } from 'src/application/use-cases/create-user/create-user.service'
import { CreateUserUseCase } from 'src/application/use-cases/create-user/create-user.use-case'
import { KmsModule } from 'src/infrastructure/kms/kms.module'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'

@Module({
	imports: [KmsModule, PrismaModule],
	providers: [{ provide: CreateUserUseCase, useClass: CreateUserService }],
	exports: [CreateUserUseCase],
})
export class CreateUserModule {}
