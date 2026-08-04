import { Module } from '@nestjs/common'
import { GetFinishedRipsService } from '../../application/use-cases/get-finished-rips/get-finished-rips.service'
import { GetFinishedRipsUseCase } from '../../application/use-cases/get-finished-rips/get-finished-rips.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'

@Module({
	imports: [IndexerModule],
	providers: [
		{
			provide: GetFinishedRipsUseCase,
			useClass: GetFinishedRipsService,
		},
	],
	exports: [GetFinishedRipsUseCase],
})
export class GetFinishedRipsModule {}
