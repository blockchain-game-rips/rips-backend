import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { CurrencyId } from '../../../domain/value-objects/currency-id'
import { ZapQuoteSwapResult } from '../../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const quoteSwapResponseSchema = z.object({
	amountOut: CurrencyAmountDto.schema,
	fee: CurrencyAmountDto.schema,
	durationMs: z.number(),
})

export class QuoteSwapResponseDto extends createZodDto(
	quoteSwapResponseSchema,
) {}

export function toQuoteSwapResponseDto(
	result: ZapQuoteSwapResult,
	prices: Map<CurrencyId, number>,
): QuoteSwapResponseDto {
	return {
		amountOut: toCurrencyAmountDto(
			result.amountOut,
			prices.get(result.amountOut.currency.id) ?? 0,
		),
		fee: toCurrencyAmountDto(
			result.fee,
			prices.get(result.fee.currency.id) ?? 0,
		),
		durationMs: result.durationMs,
	}
}
