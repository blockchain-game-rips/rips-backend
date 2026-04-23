import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import {
	CurrencyAmountDto,
	toCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const getAccruedRewardsResponseSchema = z.object({
	rewards: z.array(CurrencyAmountDto.schema),
})

export class GetAccruedRewardsResponseDto extends createZodDto(
	getAccruedRewardsResponseSchema,
) {}

export function toGetAccruedRewardsResponseDto(
	rewards: CurrencyAmount[],
): GetAccruedRewardsResponseDto {
	return {
		rewards: rewards.map((reward) => toCurrencyAmountDto(reward, 0)),
	}
}
