import { Module } from '@nestjs/common'
import { GetUnrevealedPrizesService } from '../../application/use-cases/get-unrevealed-prizes/get-unrevealed-prizes.service'
import { GetUnrevealedPrizesUseCase } from '../../application/use-cases/get-unrevealed-prizes/get-unrevealed-prizes.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, PrismaModule],
	providers: [
		{
			provide: GetUnrevealedPrizesUseCase,
			useClass: GetUnrevealedPrizesService,
		},
	],
	exports: [GetUnrevealedPrizesUseCase],
})
export class GetUnrevealedPrizesModule {}
