import { Module } from '@nestjs/common'
import { CreateUserService } from '../../application/use-cases/create-user/create-user.service'
import { CreateUserUseCase } from '../../application/use-cases/create-user/create-user.use-case'
import { EncryptionModule } from '../../infrastructure/encryption/encryption.module'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
	imports: [EncryptionModule, PrismaModule],
	providers: [{ provide: CreateUserUseCase, useClass: CreateUserService }],
	exports: [CreateUserUseCase],
})
export class CreateUserModule {}
