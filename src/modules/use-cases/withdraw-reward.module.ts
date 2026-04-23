import { Module } from '@nestjs/common'
import { WithdrawRewardService } from '../../application/use-cases/withdraw-reward/withdraw-reward.service'
import { WithdrawRewardUseCase } from '../../application/use-cases/withdraw-reward/withdraw-reward.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'
import { RipsModule } from '../../infrastructure/rips/rips.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, IndexerModule, RipsModule],
	providers: [
		{ provide: WithdrawRewardUseCase, useClass: WithdrawRewardService },
	],
	exports: [WithdrawRewardUseCase],
})
export class WithdrawRewardModule {}
