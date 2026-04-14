import { Module } from '@nestjs/common'
import { GetAvailableStakesService } from '../../application/use-cases/get-available-stakes/get-available-stakes.service'
import { GetAvailableStakesUseCase } from '../../application/use-cases/get-available-stakes/get-available-stakes.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'

@Module({
	imports: [IndexerModule],
	providers: [
		{
			provide: GetAvailableStakesUseCase,
			useClass: GetAvailableStakesService,
		},
	],
	exports: [GetAvailableStakesUseCase],
})
export class GetAvailableStakesModule {}
