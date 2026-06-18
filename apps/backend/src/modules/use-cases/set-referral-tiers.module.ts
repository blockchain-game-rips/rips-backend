import { Module } from '@nestjs/common'
import { SetReferralTiersService } from '../../application/use-cases/set-referral-tiers/set-referral-tiers.service'
import { SetReferralTiersUseCase } from '../../application/use-cases/set-referral-tiers/set-referral-tiers.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { RipsModule } from '../../infrastructure/rips/rips.module'

@Module({
	imports: [RipsModule, PrismaModule],
	providers: [
		{ provide: SetReferralTiersUseCase, useClass: SetReferralTiersService },
	],
	exports: [SetReferralTiersUseCase],
})
export class SetReferralTiersModule {}
