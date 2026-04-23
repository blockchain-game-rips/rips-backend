import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ZapQuoteBuyResult } from '../../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const quoteZapResponseSchema = z.object({
	amountIn: z.string(),
	durationMs: z.number(),
	fee: CurrencyAmountDto.schema,
})

export class QuoteZapResponseDto extends createZodDto(quoteZapResponseSchema) {}

export function toQuoteZapResponseDto(
	quote: ZapQuoteBuyResult,
	feePriceUsd: number,
): QuoteZapResponseDto {
	return {
		amountIn: quote.amountIn.toString(),
		durationMs: quote.durationMs,
		fee: toCurrencyAmountDto(quote.fee, feePriceUsd),
	}
}
