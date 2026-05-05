import { Injectable } from '@nestjs/common'
import { RipsState } from '../../../domain/value-objects/rips-state'
import { RipsReadService } from '../../interfaces/rips-read.service'
import { GetAvailableStakesUseCase } from '../get-available-stakes/get-available-stakes.use-case'
import { GetRipsStateUseCase } from './get-rips-state.use-case'

@Injectable()
export class GetRipsStateService extends GetRipsStateUseCase {
	constructor(
		private readonly ripsReadService: RipsReadService,
		private readonly getAvailableStakesUseCase: GetAvailableStakesUseCase,
	) {
		super()
	}

	async execute(): Promise<RipsState> {
		const [availableStakes, isPaused] = await Promise.all([
			this.getAvailableStakesUseCase.execute(),
			this.ripsReadService.isPaused(),
		])

		return { availableStakes, isPaused }
	}
}
