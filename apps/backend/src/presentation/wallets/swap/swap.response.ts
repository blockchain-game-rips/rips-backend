import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { PendingZap } from '../../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'
import { toTransactionDto, TransactionDto } from '../../shared/transaction.dto'

const swapResponseSchema = z.object({
	zapId: z.string(),
	srcTransaction: TransactionDto.schema,
	amountIn: CurrencyAmountDto.schema,
	fee: CurrencyAmountDto.schema,
	durationMs: z.number(),
})

export class SwapResponseDto extends createZodDto(swapResponseSchema) {}

export function toSwapResponseDto(pendingZap: PendingZap): SwapResponseDto {
	return {
		zapId: pendingZap.zapId,
		srcTransaction: toTransactionDto(pendingZap.srcTransaction),
		amountIn: toPricedCurrencyAmountDto(pendingZap.amountIn),
		fee: toPricedCurrencyAmountDto(pendingZap.fee),
		durationMs: pendingZap.durationMs,
	}
}
