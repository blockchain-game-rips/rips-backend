import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Reward } from '../../../domain/value-objects/reward'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'
import { TransactionDto, toTransactionDto } from '../../shared/transaction.dto'

const withdrawRewardResponseSchema = z.object({
	transaction: TransactionDto.schema,
	amount: CurrencyAmountDto.schema,
})

export class WithdrawRewardResponseDto extends createZodDto(
	withdrawRewardResponseSchema,
) {}

export function toWithdrawRewardResponseDto(
	reward: Reward,
): WithdrawRewardResponseDto {
	return {
		transaction: toTransactionDto(reward.transaction),
		amount: toPricedCurrencyAmountDto(reward.amount),
	}
}
