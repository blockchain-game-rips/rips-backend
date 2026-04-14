import { Module } from '@nestjs/common'
import { GetUserService } from '../../application/use-cases/get-user/get-user.service'
import { GetUserUseCase } from '../../application/use-cases/get-user/get-user.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
	imports: [PrismaModule],
	providers: [{ provide: GetUserUseCase, useClass: GetUserService }],
	exports: [GetUserUseCase],
})
export class GetUserModule {}
