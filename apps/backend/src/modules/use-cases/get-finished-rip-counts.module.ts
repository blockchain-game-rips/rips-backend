import { Module } from '@nestjs/common'
import { GetFinishedRipCountsService } from '../../application/use-cases/get-finished-rip-counts/get-finished-rip-counts.service'
import { GetFinishedRipCountsUseCase } from '../../application/use-cases/get-finished-rip-counts/get-finished-rip-counts.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'

@Module({
	imports: [IndexerModule],
	providers: [
		{
			provide: GetFinishedRipCountsUseCase,
			useClass: GetFinishedRipCountsService,
		},
	],
	exports: [GetFinishedRipCountsUseCase],
})
export class GetFinishedRipCountsModule {}
