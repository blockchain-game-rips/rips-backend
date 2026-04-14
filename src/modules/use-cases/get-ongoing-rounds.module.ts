import { Module } from '@nestjs/common'
import { GetOngoingRoundsService } from '../../application/use-cases/get-ongoing-rounds/get-ongoing-rounds.service'
import { GetOngoingRoundsUseCase } from '../../application/use-cases/get-ongoing-rounds/get-ongoing-rounds.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'

@Module({
	imports: [IndexerModule],
	providers: [
		{ provide: GetOngoingRoundsUseCase, useClass: GetOngoingRoundsService },
	],
	exports: [GetOngoingRoundsUseCase],
})
export class GetOngoingRoundsModule {}
