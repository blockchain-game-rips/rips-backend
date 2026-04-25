import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Referrer } from '../../../domain/entities/referrer'

const referrerStateSchema = z.object({
	currency: z.string(),
	fee: z.number(),
	volume: z.object({
		monthStart: z.string().nullable(),
		currentMonth: z.string(),
	}),
	rewards: z.object({
		available: z.string(),
		withdrawn: z.string(),
	}),
})

const getReferrerResponseSchema = z.object({
	referrer: z.string(),
	states: z.array(referrerStateSchema),
})

export class GetReferrerResponseDto extends createZodDto(
	getReferrerResponseSchema,
) {}

export function toGetReferrerResponseDto(
	data: Referrer,
): GetReferrerResponseDto {
	return {
		referrer: data.address,
		states: data.states.map((state) => ({
			currency: state.currency.id,
			fee: state.fee,
			volume: {
				monthStart:
					state.volume.monthStart === null
						? null
						: state.volume.monthStart.toISOString(),
				currentMonth: state.volume.currentMonth.toString(),
			},
			rewards: {
				available: state.rewards.available.toString(),
				withdrawn: state.rewards.withdrawn.toString(),
			},
		})),
	}
}
