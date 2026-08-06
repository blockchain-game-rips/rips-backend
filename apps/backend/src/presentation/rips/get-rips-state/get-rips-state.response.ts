import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { availablePresetSchema } from '../shared/available-preset.dto'

const getRipsStateSchema = z.object({
	availablePresets: z.array(availablePresetSchema),
	isPaused: z.boolean(),
})

export class GetRipsStateResponseDto extends createZodDto(getRipsStateSchema) {}
