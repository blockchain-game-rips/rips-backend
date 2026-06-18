import { Module } from '@nestjs/common'
import { CreateUserService } from '../../application/use-cases/create-user/create-user.service'
import { CreateUserUseCase } from '../../application/use-cases/create-user/create-user.use-case'
import { KmsModule } from '../../infrastructure/kms/kms.module'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
	imports: [KmsModule, PrismaModule],
	providers: [{ provide: CreateUserUseCase, useClass: CreateUserService }],
	exports: [CreateUserUseCase],
})
export class CreateUserModule {}
