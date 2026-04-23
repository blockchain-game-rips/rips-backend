import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import {
	CurrencyAmountDto,
	toCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const getRewardsResponseSchema = z.object({
	rewards: z.array(CurrencyAmountDto.schema),
})

export class GetRewardsResponseDto extends createZodDto(
	getRewardsResponseSchema,
) {}

export function toGetRewardsResponseDto(
	rewards: CurrencyAmount[],
): GetRewardsResponseDto {
	return {
		rewards: rewards.map((reward) => toCurrencyAmountDto(reward, 0)),
	}
}
