import { Module } from '@nestjs/common'
import { GetUnrevealedPayoutsService } from '../../application/use-cases/get-unrevealed-payouts/get-unrevealed-payouts.service'
import { GetUnrevealedPayoutsUseCase } from '../../application/use-cases/get-unrevealed-payouts/get-unrevealed-payouts.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, PrismaModule],
	providers: [
		{
			provide: GetUnrevealedPayoutsUseCase,
			useClass: GetUnrevealedPayoutsService,
		},
	],
	exports: [GetUnrevealedPayoutsUseCase],
})
export class GetUnrevealedPayoutsModule {}
