import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { SamechainSwapResult } from '../../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'
import { toTransactionDto, TransactionDto } from '../../shared/transaction.dto'

const swapSamechainResponseSchema = z.object({
	transaction: TransactionDto.schema,
	amountOut: CurrencyAmountDto.schema,
})

export class SwapSamechainResponseDto extends createZodDto(
	swapSamechainResponseSchema,
) {}

export function toSwapSamechainResponseDto(
	result: SamechainSwapResult,
): SwapSamechainResponseDto {
	return {
		transaction: toTransactionDto(result.transaction),
		amountOut: toPricedCurrencyAmountDto(result.amountOut),
	}
}
