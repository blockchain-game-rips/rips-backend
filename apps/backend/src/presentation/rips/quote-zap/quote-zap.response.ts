import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ZapQuoteBuyResult } from '../../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const quoteZapResponseSchema = z.object({
	amountIn: CurrencyAmountDto.schema,
	durationMs: z.number(),
	fee: CurrencyAmountDto.schema,
	blockchainFee: CurrencyAmountDto.schema,
})

export class QuoteZapResponseDto extends createZodDto(quoteZapResponseSchema) {}

export function toQuoteZapResponseDto(
	quote: ZapQuoteBuyResult,
): QuoteZapResponseDto {
	return {
		amountIn: toPricedCurrencyAmountDto(quote.amountIn),
		durationMs: quote.durationMs,
		fee: toPricedCurrencyAmountDto(quote.fee),
		blockchainFee: toPricedCurrencyAmountDto(
			quote.transactionQuote.blockchainFee,
		),
	}
}
