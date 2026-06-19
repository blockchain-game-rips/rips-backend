import { Module } from '@nestjs/common'
import { GetCompletedRipsService } from '../../application/use-cases/get-completed-rips/get-completed-rips.service'
import { GetCompletedRipsUseCase } from '../../application/use-cases/get-completed-rips/get-completed-rips.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'

@Module({
	imports: [IndexerModule],
	providers: [
		{
			provide: GetCompletedRipsUseCase,
			useClass: GetCompletedRipsService,
		},
	],
	exports: [GetCompletedRipsUseCase],
})
export class GetCompletedRipsModule {}
