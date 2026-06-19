import { Injectable } from '@nestjs/common'
import { OngoingRip } from '../../../domain/entities/rip'
import { PresetRepository } from '../../interfaces/repositories/preset.repository'
import { GetOngoingRipsUseCase } from './get-ongoing-rips.use-case'

@Injectable()
export class GetOngoingRipsService extends GetOngoingRipsUseCase {
	constructor(private readonly presetRepository: PresetRepository) {
		super()
	}

	async execute(): Promise<OngoingRip[]> {
		const presetsWithRips =
			await this.presetRepository.getPresetsWithOngoingRips()

		return presetsWithRips.flatMap(({ ongoingRips }) => ongoingRips)
	}
}
