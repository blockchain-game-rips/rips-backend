import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { CurrencyId } from '../../../domain/value-objects/currency-id'
import { ZapQuoteBuyResult } from '../../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toCurrencyAmountDto,
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
	prices: Map<CurrencyId, number>,
): QuoteZapResponseDto {
	return {
		amountIn: toCurrencyAmountDto(
			quote.amountIn,
			prices.get(quote.amountIn.currency.id) ?? 0,
		),
		durationMs: quote.durationMs,
		fee: toCurrencyAmountDto(
			quote.fee,
			prices.get(quote.fee.currency.id) ?? 0,
		),
		blockchainFee: toCurrencyAmountDto(
			quote.transactionQuote.blockchainFee,
			prices.get(quote.transactionQuote.blockchainFee.currency.id) ?? 0,
		),
	}
}
