import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { PrizeDto } from '../shared/prize.dto'

const getPrizesResponseSchema = z.object({
	prizes: z.array(PrizeDto.schema),
})

export class GetPrizesResponseDto extends createZodDto(
	getPrizesResponseSchema,
) {}
