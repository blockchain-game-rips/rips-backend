import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { AvailablePreset } from '../../../domain/value-objects/available-preset'
import { configSchema, toConfigDto } from './config.dto'
import { ripSchema, toRipDto } from './rip.dto'

const presetSchema = z.object({
	id: z.number(),
	currentConfig: configSchema.nullable(),
})

const availablePresetSchema = z.object({
	preset: presetSchema,
	fillingRip: ripSchema.nullable(),
})

export class AvailablePresetDto extends createZodDto(availablePresetSchema) {}

export function toAvailablePresetDto(
	availablePreset: AvailablePreset,
): AvailablePresetDto {
	if (availablePreset.fillingRip === null) {
		return {
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
		preset: {
			id: availablePreset.preset.id,
			currentConfig: null,
		},
		fillingRip: toRipDto(availablePreset.fillingRip),
	}
}
