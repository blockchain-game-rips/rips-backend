import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { PrizeDto } from '../shared/prize.dto'

const revealPrizesResponseSchema = z.object({
	prizes: z.array(PrizeDto.schema),
})

export class RevealPrizesResponseDto extends createZodDto(
	revealPrizesResponseSchema,
) {}
