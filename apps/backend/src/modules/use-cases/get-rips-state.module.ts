import { Module } from '@nestjs/common'
import { GetRipsStateService } from '../../application/use-cases/get-rips-state/get-rips-state.service'
import { GetRipsStateUseCase } from '../../application/use-cases/get-rips-state/get-rips-state.use-case'
import { RipsModule } from '../../infrastructure/rips/rips.module'
import { GetAvailableStakesModule } from './get-available-stakes.module'

@Module({
	imports: [RipsModule, GetAvailableStakesModule],
	providers: [
		{ provide: GetRipsStateUseCase, useClass: GetRipsStateService },
	],
	exports: [GetRipsStateUseCase],
})
export class GetRipsStateModule {}
