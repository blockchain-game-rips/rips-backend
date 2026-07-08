import { Config } from '../entities/config'
import { AvailablePresetNotFoundError } from '../errors/preset-not-found.error'
import { AvailablePreset } from '../value-objects/available-preset'

export function findAvailablePreset(
	availablePresets: AvailablePreset[],
	presetId: number,
): AvailablePreset {
	const availablePreset = availablePresets.find(
		(s) => s.preset.id === presetId,
	)

	if (!availablePreset) {
		throw new AvailablePresetNotFoundError(
			`Preset with id ${presetId} not found in available presets`,
		)
	}

	return availablePreset
}

export function resolveConfig(availablePreset: AvailablePreset): Config {
	return availablePreset.fillingRip !== null
		? availablePreset.fillingRip.config
		: availablePreset.preset.currentConfig
}
