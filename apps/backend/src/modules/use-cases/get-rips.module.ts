import { Module } from '@nestjs/common'
import { GetRipsService } from '../../application/use-cases/get-rips/get-rips.service'
import { GetRipsUseCase } from '../../application/use-cases/get-rips/get-rips.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'

@Module({
	imports: [IndexerModule],
	providers: [
		{
			provide: GetRipsUseCase,
			useClass: GetRipsService,
		},
	],
	exports: [GetRipsUseCase],
})
export class GetRipsModule {}
