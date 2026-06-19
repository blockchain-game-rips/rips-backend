import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { AvailablePresetDto } from '../shared/available-preset.dto'

const getRipsStateSchema = z.object({
	availablePresets: z.array(AvailablePresetDto.schema),
	isPaused: z.boolean(),
})

export class GetRipsStateResponseDto extends createZodDto(getRipsStateSchema) {}
