import z from 'zod'
import { AvailablePreset } from '../../../domain/value-objects/available-preset'
import { configSchema, toConfigDto } from './config.dto'
import { ripSchema, toRipDto } from './rip.dto'

export const PresetAvailability = {
	/** A rip is filling right now, so entering joins it. */
	LIVE: 'LIVE',
	/** No rip is filling, so entering creates one from the current config. */
	READY: 'READY',
} as const

const livePresetSchema = z.object({
	availability: z.literal(PresetAvailability.LIVE),
	preset: z.object({ id: z.number() }),
	fillingRip: ripSchema,
})

const readyPresetSchema = z.object({
	availability: z.literal(PresetAvailability.READY),
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

	return {
		availability: PresetAvailability.LIVE,
		preset: { id: availablePreset.preset.id },
		fillingRip: toRipDto(availablePreset.fillingRip),
	}
}
