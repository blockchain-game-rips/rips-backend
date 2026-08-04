import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Referrer } from '../../../domain/entities/referrer'
import { CurrencyDto } from '../../shared/currency.dto'
import { PricedCurrency } from '../../shared/pricing/priced-currency'

const referrerStateSchema = z.object({
	currency: CurrencyDto.schema,
	fee: z
		.number()
		.describe(
			'Referral fee in basis points. Falls back to the global default referral fee when the referrer has no tier progress or custom fee yet.',
		),
	period: z.object({
		startTime: z
			.string()
			.nullable()
			.describe(
				'Start of the current referral period. Null until the referrer records their first on-chain volume.',
			),
		volume: z
			.string()
			.describe(
				'Volume referred during the current period, as a base-unit integer string. "0" for a referrer with no on-chain activity.',
			),
	}),
	rewards: z.object({
		available: z
			.string()
			.describe(
				'Rewards withdrawable now, as a base-unit integer string. "0" for a referrer with no on-chain activity.',
			),
		withdrawn: z
			.string()
			.describe(
				'Rewards already withdrawn, as a base-unit integer string. "0" for a referrer with no on-chain activity.',
			),
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
			currency: new PricedCurrency(state.currency),
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
