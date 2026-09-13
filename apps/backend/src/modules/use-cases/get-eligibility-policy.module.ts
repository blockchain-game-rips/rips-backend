import { Module } from '@nestjs/common'
import { GetEligibilityPolicyService } from '../../application/use-cases/get-eligibility-policy/get-eligibility-policy.service'
import { GetEligibilityPolicyUseCase } from '../../application/use-cases/get-eligibility-policy/get-eligibility-policy.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
	imports: [PrismaModule],
	providers: [
		{
			provide: GetEligibilityPolicyUseCase,
			useClass: GetEligibilityPolicyService,
		},
	],
	exports: [GetEligibilityPolicyUseCase],
})
export class GetEligibilityPolicyModule {}
