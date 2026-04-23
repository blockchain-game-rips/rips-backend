import { Module } from '@nestjs/common'
import { RewardSystemController } from '../../presentation/reward-system/reward-system.controller'
import { GetAccruedRewardsModule } from '../use-cases/get-accrued-rewards.module'
import { GetPriceModule } from '../use-cases/get-price.module'
import { GetRewardsModule } from '../use-cases/get-rewards.module'
import { WithdrawRewardModule } from '../use-cases/withdraw-reward.module'

@Module({
	imports: [
		GetRewardsModule,
		GetAccruedRewardsModule,
		WithdrawRewardModule,
		GetPriceModule,
	],
	controllers: [RewardSystemController],
})
export class RewardSystemModule {}
