import { Module } from '@nestjs/common'
import { GetOngoingRipsService } from '../../application/use-cases/get-ongoing-rips/get-ongoing-rips.service'
import { GetOngoingRipsUseCase } from '../../application/use-cases/get-ongoing-rips/get-ongoing-rips.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'

@Module({
	imports: [IndexerModule],
	providers: [
		{ provide: GetOngoingRipsUseCase, useClass: GetOngoingRipsService },
	],
	exports: [GetOngoingRipsUseCase],
})
export class GetOngoingRipsModule {}
