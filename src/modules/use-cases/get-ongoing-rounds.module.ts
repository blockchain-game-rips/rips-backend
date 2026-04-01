import { Module } from '@nestjs/common'
import { GetOngoingRoundsService } from 'src/application/use-cases/get-ongoing-rounds/get-ongoing-rounds.service'
import { GetOngoingRoundsUseCase } from 'src/application/use-cases/get-ongoing-rounds/get-ongoing-rounds.use-case'
import { IndexerModule } from 'src/infrastructure/indexer/indexer.module'

@Module({
	imports: [IndexerModule],
	providers: [
		{ provide: GetOngoingRoundsUseCase, useClass: GetOngoingRoundsService },
	],
	exports: [GetOngoingRoundsUseCase],
})
export class GetOngoingRoundsModule {}
