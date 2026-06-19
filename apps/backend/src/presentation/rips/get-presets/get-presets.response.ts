import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { AvailablePresetDto } from '../shared/available-preset.dto'

const getAvailablePresetsSchema = z.object({
	availablePresets: z.array(AvailablePresetDto.schema),
})

export class GetPresetsResponseDto extends createZodDto(
	getAvailablePresetsSchema,
) {}
