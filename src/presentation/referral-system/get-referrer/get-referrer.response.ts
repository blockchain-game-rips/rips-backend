import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ReferrerWithStates } from '../../../domain/entities/referrer'
import { CurrencyId } from '../../../domain/value-objects/currency-id'
import {
	CurrencyAmountDto,
	toCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const referrerStateSchema = z.object({
	defaultFeePercent: z.number(),
	activeFeePercent: z.number(),
	customFeePercent: z.number(),
	monthStartTimestamp: z.date(),
	currMonthVolume: CurrencyAmountDto.schema,
})

const getReferrerResponseSchema = z.object({
	referrer: z.string(),
	states: z.array(referrerStateSchema),
	rewards: z.object({
		availableToWithdraw: z.array(CurrencyAmountDto.schema),
		withdrawnRewards: z.array(CurrencyAmountDto.schema),
	}),
})

export class GetReferrerResponseDto extends createZodDto(
	getReferrerResponseSchema,
) {}

export function toGetReferrerResponseDto(
	data: ReferrerWithStates,
	prices: Map<CurrencyId, number>,
): GetReferrerResponseDto {
	return {
		referrer: data.referrer,
		states: data.states.map((state) => ({
			defaultFeePercent: state.defaultFeePercent,
			activeFeePercent: state.activeFeePercent,
			customFeePercent: state.customFeePercent,
			monthStartTimestamp: state.monthStartTimestamp,
			currMonthVolume: toCurrencyAmountDto(
				state.currMonthVolume,
				prices.get(state.currMonthVolume.currency.id) ?? 0,
			),
		})),
		rewards: {
			availableToWithdraw: data.rewards.availableToWithdraw.map((a) =>
				toCurrencyAmountDto(a, prices.get(a.currency.id) ?? 0),
			),
			withdrawnRewards: data.rewards.withdrawnRewards.map((w) =>
				toCurrencyAmountDto(w, prices.get(w.currency.id) ?? 0),
			),
		},
	}
}
