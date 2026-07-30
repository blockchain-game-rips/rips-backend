import { Module } from '@nestjs/common'
import { GetPayoutsService } from '../../application/use-cases/get-payouts/get-payouts.service'
import { GetPayoutsUseCase } from '../../application/use-cases/get-payouts/get-payouts.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, PrismaModule],
	providers: [
		{
			provide: GetPayoutsUseCase,
			useClass: GetPayoutsService,
		},
	],
	exports: [GetPayoutsUseCase],
})
export class GetPayoutsModule {}
