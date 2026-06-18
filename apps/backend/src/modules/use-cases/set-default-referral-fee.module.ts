import { Module } from '@nestjs/common'
import { SetDefaultReferralFeeService } from '../../application/use-cases/set-default-referral-fee/set-default-referral-fee.service'
import { SetDefaultReferralFeeUseCase } from '../../application/use-cases/set-default-referral-fee/set-default-referral-fee.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { RipsModule } from '../../infrastructure/rips/rips.module'

@Module({
	imports: [RipsModule, PrismaModule],
	providers: [
		{
			provide: SetDefaultReferralFeeUseCase,
			useClass: SetDefaultReferralFeeService,
		},
	],
	exports: [SetDefaultReferralFeeUseCase],
})
export class SetDefaultReferralFeeModule {}
