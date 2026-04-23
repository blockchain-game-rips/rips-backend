import { Module } from '@nestjs/common'
import { GetAccruedRewardsService } from '../../application/use-cases/get-accrued-rewards/get-accrued-rewards.service'
import { GetAccruedRewardsUseCase } from '../../application/use-cases/get-accrued-rewards/get-accrued-rewards.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, IndexerModule],
	providers: [
		{
			provide: GetAccruedRewardsUseCase,
			useClass: GetAccruedRewardsService,
		},
	],
	exports: [GetAccruedRewardsUseCase],
})
export class GetAccruedRewardsModule {}
