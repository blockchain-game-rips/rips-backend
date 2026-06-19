import { Module } from '@nestjs/common'
import { GetAvailablePresetsService } from '../../application/use-cases/get-available-presets/get-available-presets.service'
import { GetAvailablePresetsUseCase } from '../../application/use-cases/get-available-presets/get-available-presets.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'

@Module({
	imports: [IndexerModule],
	providers: [
		{
			provide: GetAvailablePresetsUseCase,
			useClass: GetAvailablePresetsService,
		},
	],
	exports: [GetAvailablePresetsUseCase],
})
export class GetAvailablePresetsModule {}
