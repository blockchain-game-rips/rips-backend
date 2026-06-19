import { Module } from '@nestjs/common'
import { GetRipsStateService } from '../../application/use-cases/get-rips-state/get-rips-state.service'
import { GetRipsStateUseCase } from '../../application/use-cases/get-rips-state/get-rips-state.use-case'
import { RipsModule } from '../../infrastructure/rips/rips.module'
import { GetAvailablePresetsModule } from './get-available-presets.module'

@Module({
	imports: [RipsModule, GetAvailablePresetsModule],
	providers: [
		{ provide: GetRipsStateUseCase, useClass: GetRipsStateService },
	],
	exports: [GetRipsStateUseCase],
})
export class GetRipsStateModule {}
