import { Module } from '@nestjs/common'
import { GetRoundsService } from 'src/application/use-cases/get-rounds/get-rounds.service'
import { GetRoundsUseCase } from 'src/application/use-cases/get-rounds/get-rounds.use-case'
import { IndexerModule } from 'src/infrastructure/indexer/indexer.module'

@Module({
	imports: [IndexerModule],
	providers: [{ provide: GetRoundsUseCase, useClass: GetRoundsService }],
	exports: [GetRoundsUseCase],
})
export class GetRoundsModule {}
