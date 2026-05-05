import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { AvailableStakeDto } from '../shared/available-stake.dto'

const getRipsStateSchema = z.object({
	availableStakes: z.array(AvailableStakeDto.schema),
	isPaused: z.boolean(),
})

export class GetRipsStateResponseDto extends createZodDto(getRipsStateSchema) {}
