import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { availablePresetSchema } from '../shared/available-preset.dto'

const getAvailablePresetsSchema = z.object({
	availablePresets: z.array(availablePresetSchema),
})

export class GetPresetsResponseDto extends createZodDto(
	getAvailablePresetsSchema,
) {}
