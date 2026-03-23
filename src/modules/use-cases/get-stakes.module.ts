import { Module } from '@nestjs/common'
import { GetStakesService } from 'src/application/use-cases/get-stakes/get-stakes.service'
import { GetStakesUseCase } from 'src/application/use-cases/get-stakes/get-stakes.use-case'
import { IndexerModule } from 'src/infrastructure/indexer/indexer.module'

@Module({
	imports: [IndexerModule],
	providers: [{ provide: GetStakesUseCase, useClass: GetStakesService }],
	exports: [GetStakesUseCase],
})
export class GetStakesModule {}
