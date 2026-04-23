import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ZapQuoteBuyResult } from '../../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const quoteZapResponseSchema = z.object({
	amountIn: CurrencyAmountDto.schema,
	durationMs: z.number(),
	fee: CurrencyAmountDto.schema,
})

export class QuoteZapResponseDto extends createZodDto(quoteZapResponseSchema) {}

export function toQuoteZapResponseDto(
	quote: ZapQuoteBuyResult,
	amountInPriceUsd: number,
	feePriceUsd: number,
): QuoteZapResponseDto {
	return {
		amountIn: toCurrencyAmountDto(quote.amountIn, amountInPriceUsd),
		durationMs: quote.durationMs,
		fee: toCurrencyAmountDto(quote.fee, feePriceUsd),
	}
}
