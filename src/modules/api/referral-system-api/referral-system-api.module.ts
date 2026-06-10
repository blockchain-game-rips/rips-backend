import { Module } from '@nestjs/common'
import { KNOWN_TOKENS } from '../../../infrastructure/evm/primitives/currencies/constants'
import { PriceOracleModule } from '../../../infrastructure/price-provider/price-provider.module'
import { ReferralSystemController } from '../../../presentation/referral-system/referral-system.controller'
import { GetReferrerTierTablesModule } from '../../use-cases/get-referrer-tier-tables.module'
import { GetReferrerModule } from '../../use-cases/get-referrer.module'
import { WithdrawRewardModule } from '../../use-cases/withdraw-reward.module'

@Module({
	imports: [
		PriceOracleModule.forRoot(Array.from(KNOWN_TOKENS.keys())),
		GetReferrerModule,
		GetReferrerTierTablesModule,
		WithdrawRewardModule,
	],
	controllers: [ReferralSystemController],
})
export class ReferralSystemApiModule {}
