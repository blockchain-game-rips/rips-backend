import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { AvailableStakeDto } from '../shared/available-stake.dto'

const getAvailableStakesSchema = z.object({
	availableStakes: z.array(AvailableStakeDto.schema),
})

export class GetStakesResponseDto extends createZodDto(
	getAvailableStakesSchema,
) {}
