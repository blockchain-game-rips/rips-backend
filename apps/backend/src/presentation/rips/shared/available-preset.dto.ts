import z from 'zod'
import { AvailablePreset } from '../../../domain/value-objects/available-preset'
import { configSchema, toConfigDto } from './config.dto'
import { ripSchema, toRipDto } from './rip.dto'

export const PresetAvailability = {
	LIVE: 'LIVE',
	READY: 'READY',
} as const

const livePresetSchema = z.object({
	availability: z
		.literal(PresetAvailability.LIVE)
		.describe('A rip is filling right now, so entering joins it.'),
	preset: z.object({
		id: z.number(),
		currentConfig: configSchema
			.nullable()
			.describe(
				'Config the next rip is created from, or null if the preset ' +
					'was deleted and the filling rip is its last.',
			),
	}),
	fillingRip: ripSchema,
})

const readyPresetSchema = z.object({
	availability: z
		.literal(PresetAvailability.READY)
		.describe(
			'No rip is filling, so entering creates one from the current config.',
		),
	preset: z.object({ id: z.number(), currentConfig: configSchema }),
	fillingRip: z.null(),
})

export const availablePresetSchema = z
	.discriminatedUnion('availability', [livePresetSchema, readyPresetSchema])
	.meta({ id: 'AvailablePresetDto' })

export type AvailablePresetDto = z.infer<typeof availablePresetSchema>

export function toAvailablePresetDto(
	availablePreset: AvailablePreset,
): AvailablePresetDto {
	if (availablePreset.fillingRip === null) {
		return {
			availability: PresetAvailability.READY,
			preset: {
				id: availablePreset.preset.id,
				currentConfig: toConfigDto(
					availablePreset.preset.currentConfig,
				),
			},
			fillingRip: null,
		}
	}

	const { currentConfig } = availablePreset.preset

	return {
		availability: PresetAvailability.LIVE,
		preset: {
			id: availablePreset.preset.id,
			currentConfig:
				currentConfig !== null ? toConfigDto(currentConfig) : null,
		},
		fillingRip: toRipDto(availablePreset.fillingRip),
	}
}
