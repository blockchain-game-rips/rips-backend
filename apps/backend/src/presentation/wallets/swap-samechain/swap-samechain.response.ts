import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { SamechainSwapResult } from '../../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'
import {
	approvalAttemptSchema,
	toApprovalAttemptDto,
	toTransactionAttemptWithDto,
	transactionAttemptSchema,
} from '../../shared/transaction-attempt.dto'

const swapSamechainResponseSchema = z.object({
	approval: approvalAttemptSchema(),
	swap: transactionAttemptSchema(
		z.object({ amountOut: CurrencyAmountDto.schema }),
	),
})

export class SwapSamechainResponseDto extends createZodDto(
	swapSamechainResponseSchema,
) {}

export function toSwapSamechainResponseDto(
	result: SamechainSwapResult,
): SwapSamechainResponseDto {
	return {
		approval: toApprovalAttemptDto(result.approval),
		swap: toTransactionAttemptWithDto(result.swap, ({ amountOut }) => ({
			amountOut: toPricedCurrencyAmountDto(amountOut),
		})),
	}
}
