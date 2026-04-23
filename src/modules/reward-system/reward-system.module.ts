import { Module } from '@nestjs/common'
import { RewardSystemController } from '../../presentation/reward-system/reward-system.controller'
import { GetPriceModule } from '../use-cases/get-price.module'
import { GetRewardsModule } from '../use-cases/get-rewards.module'
import { WithdrawRewardModule } from '../use-cases/withdraw-reward.module'

@Module({
	imports: [GetRewardsModule, WithdrawRewardModule, GetPriceModule],
	controllers: [RewardSystemController],
})
export class RewardSystemModule {}
