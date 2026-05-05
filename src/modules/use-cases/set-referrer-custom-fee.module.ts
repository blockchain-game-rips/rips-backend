import { Module } from '@nestjs/common'
import { SetReferrerCustomFeeService } from '../../application/use-cases/set-referrer-custom-fee/set-referrer-custom-fee.service'
import { SetReferrerCustomFeeUseCase } from '../../application/use-cases/set-referrer-custom-fee/set-referrer-custom-fee.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { RipsModule } from '../../infrastructure/rips/rips.module'

@Module({
	imports: [RipsModule, PrismaModule],
	providers: [
		{
			provide: SetReferrerCustomFeeUseCase,
			useClass: SetReferrerCustomFeeService,
		},
	],
	exports: [SetReferrerCustomFeeUseCase],
})
export class SetReferrerCustomFeeModule {}
