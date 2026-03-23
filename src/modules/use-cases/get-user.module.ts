import { Module } from '@nestjs/common'
import { GetUserService } from 'src/application/use-cases/get-user/get-user.service'
import { GetUserUseCase } from 'src/application/use-cases/get-user/get-user.use-case'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'

@Module({
	imports: [PrismaModule],
	providers: [{ provide: GetUserUseCase, useClass: GetUserService }],
	exports: [GetUserUseCase],
})
export class GetUserModule {}
