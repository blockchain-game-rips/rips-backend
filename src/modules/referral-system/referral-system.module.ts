import { Module } from '@nestjs/common'
import { ReferralSystemController } from '../../presentation/referral-system/referral-system.controller'
import { GetPriceModule } from '../use-cases/get-price.module'
import { GetReferrerTierTablesModule } from '../use-cases/get-referrer-tier-tables.module'
import { GetReferrerModule } from '../use-cases/get-referrer.module'
import { WithdrawRewardModule } from '../use-cases/withdraw-reward.module'

@Module({
	imports: [
		GetReferrerModule,
		GetReferrerTierTablesModule,
		WithdrawRewardModule,
		GetPriceModule,
	],
	controllers: [ReferralSystemController],
})
export class ReferralSystemModule {}
