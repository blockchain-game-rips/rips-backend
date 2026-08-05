import { Module } from '@nestjs/common'
import { ReferralSystemController } from '../../../presentation/referral-system/referral-system.controller'
import { GetReferrerTierTablesModule } from '../../use-cases/get-referrer-tier-tables.module'
import { GetReferrerModule } from '../../use-cases/get-referrer.module'
import { QuoteWithdrawRewardModule } from '../../use-cases/quote-withdraw-reward.module'
import { WithdrawRewardModule } from '../../use-cases/withdraw-reward.module'

@Module({
	imports: [
		GetReferrerModule,
		GetReferrerTierTablesModule,
		WithdrawRewardModule,
		QuoteWithdrawRewardModule,
	],
	controllers: [ReferralSystemController],
})
export class ReferralSystemApiModule {}
