import { Injectable } from '@nestjs/common'
import { Rip, RipStatus } from '../../../domain/entities/rip'
import { AvailablePreset } from '../../../domain/value-objects/available-preset'
import { PresetRepository } from '../../interfaces/repositories/preset.repository'
import { GetAvailablePresetsUseCase } from './get-available-presets.use-case'

@Injectable()
export class GetAvailablePresetsService extends GetAvailablePresetsUseCase {
	constructor(private readonly presetRepository: PresetRepository) {
		super()
	}

	async execute(): Promise<AvailablePreset[]> {
		const presetsWithRips =
			await this.presetRepository.getPresetsWithOngoingRips()

		const result: AvailablePreset[] = []

		for (const { preset, ongoingRips } of presetsWithRips) {
			const fillingRip =
				ongoingRips.find(
					(rip): rip is Rip & { status: RipStatus.FILLING } =>
						rip.status === RipStatus.FILLING,
				) ?? null

			if (fillingRip !== null) {
				result.push({ preset, fillingRip })
				continue
			}

			if (preset.currentConfig !== null) {
				result.push({
					preset: { ...preset, currentConfig: preset.currentConfig },
					fillingRip: null,
				})
			}
		}

		return result
	}
}
