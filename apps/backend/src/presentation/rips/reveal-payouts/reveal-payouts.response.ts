import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { PayoutDto } from '../shared/payout.dto'

const revealPayoutsResponseSchema = z.object({
	payouts: z.array(PayoutDto.schema),
})

export class RevealPayoutsResponseDto extends createZodDto(
	revealPayoutsResponseSchema,
) {}
