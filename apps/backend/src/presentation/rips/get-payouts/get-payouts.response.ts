import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { PayoutDto } from '../shared/payout.dto'

const getPayoutsResponseSchema = z.object({
	payouts: z.array(PayoutDto.schema),
})

export class GetPayoutsResponseDto extends createZodDto(
	getPayoutsResponseSchema,
) {}
