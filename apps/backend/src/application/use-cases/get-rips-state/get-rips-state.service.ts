import { Injectable } from '@nestjs/common'
import { RipsState } from '../../../domain/value-objects/rips-state'
import { RipsReadService } from '../../interfaces/rips-read.service'
import { GetAvailablePresetsUseCase } from '../get-available-presets/get-available-presets.use-case'
import { GetRipsStateUseCase } from './get-rips-state.use-case'

@Injectable()
export class GetRipsStateService extends GetRipsStateUseCase {
	constructor(
		private readonly ripsReadService: RipsReadService,
		private readonly getAvailablePresetsUseCase: GetAvailablePresetsUseCase,
	) {
		super()
	}

	async execute(): Promise<RipsState> {
		const [availablePresets, isPaused] = await Promise.all([
			this.getAvailablePresetsUseCase.execute(),
			this.ripsReadService.isPaused(),
		])

		return { availablePresets, isPaused }
	}
}
