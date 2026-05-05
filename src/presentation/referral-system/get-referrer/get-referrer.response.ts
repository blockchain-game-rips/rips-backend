import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Referrer } from '../../../domain/entities/referrer'
import { CurrencyId } from '../../../domain/value-objects/currency-id'
import { CurrencyDto, toCurrencyDto } from '../../shared/currency.dto'

const referrerStateSchema = z.object({
	currency: CurrencyDto.schema,
	fee: z.number(),
	period: z.object({
		startTime: z.string().nullable(),
		volume: z.string(),
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
	prices: Map<CurrencyId, number>,
): GetReferrerResponseDto {
	return {
		referrer: data.address,
		states: data.states.map((state) => ({
			currency: toCurrencyDto(
				state.currency,
				prices.get(state.currency.id) ?? 0,
			),
			fee: state.fee,
			period: {
				startTime:
					state.period.startTime === null
						? null
						: state.period.startTime.toISOString(),
				volume: state.period.volume.toString(),
			},
			rewards: {
				available: state.rewards.available.toString(),
				withdrawn: state.rewards.withdrawn.toString(),
			},
		})),
	}
}
