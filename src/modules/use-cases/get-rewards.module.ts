import { Module } from '@nestjs/common'
import { GetRewardsService } from '../../application/use-cases/get-rewards/get-rewards.service'
import { GetRewardsUseCase } from '../../application/use-cases/get-rewards/get-rewards.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, IndexerModule],
	providers: [{ provide: GetRewardsUseCase, useClass: GetRewardsService }],
	exports: [GetRewardsUseCase],
})
export class GetRewardsModule {}
