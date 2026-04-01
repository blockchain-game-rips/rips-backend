import { Module } from '@nestjs/common'
import { GetCompletedRoundsService } from 'src/application/use-cases/get-completed-rounds/get-completed-rounds.service'
import { GetCompletedRoundsUseCase } from 'src/application/use-cases/get-completed-rounds/get-completed-rounds.use-case'
import { IndexerModule } from 'src/infrastructure/indexer/indexer.module'

@Module({
	imports: [IndexerModule],
	providers: [
		{
			provide: GetCompletedRoundsUseCase,
			useClass: GetCompletedRoundsService,
		},
	],
	exports: [GetCompletedRoundsUseCase],
})
export class GetCompletedRoundsModule {}
