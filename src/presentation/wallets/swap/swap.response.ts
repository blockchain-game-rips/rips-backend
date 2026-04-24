import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { CurrencyId } from '../../../domain/value-objects/currency-id'
import { PendingZap } from '../../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toCurrencyAmountDto,
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

export function toSwapResponseDto(
	pendingZap: PendingZap,
	prices: Map<CurrencyId, number>,
): SwapResponseDto {
	return {
		zapId: pendingZap.zapId,
		srcTransaction: toTransactionDto(pendingZap.srcTransaction),
		amountIn: toCurrencyAmountDto(
			pendingZap.amountIn,
			prices.get(pendingZap.amountIn.currency.id) ?? 0,
		),
		fee: toCurrencyAmountDto(
			pendingZap.fee,
			prices.get(pendingZap.fee.currency.id) ?? 0,
		),
		durationMs: pendingZap.durationMs,
	}
}
