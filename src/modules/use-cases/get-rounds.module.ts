import { Module } from '@nestjs/common'
import { GetRoundsService } from '../../application/use-cases/get-rounds/get-rounds.service'
import { GetRoundsUseCase } from '../../application/use-cases/get-rounds/get-rounds.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'

@Module({
	imports: [IndexerModule],
	providers: [
		{
			provide: GetRoundsUseCase,
			useClass: GetRoundsService,
		},
	],
	exports: [GetRoundsUseCase],
})
export class GetRoundsModule {}
