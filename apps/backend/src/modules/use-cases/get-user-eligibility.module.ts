import { Module } from '@nestjs/common'
import { GetUserEligibilityService } from '../../application/use-cases/get-user-eligibility/get-user-eligibility.service'
import { GetUserEligibilityUseCase } from '../../application/use-cases/get-user-eligibility/get-user-eligibility.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
	imports: [PrismaModule],
	providers: [
		{
			provide: GetUserEligibilityUseCase,
			useClass: GetUserEligibilityService,
		},
	],
	exports: [GetUserEligibilityUseCase],
})
export class GetUserEligibilityModule {}
