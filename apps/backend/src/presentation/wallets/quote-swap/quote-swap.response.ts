import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ZapQuoteSwapResult } from '../../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const quoteSwapResponseSchema = z.object({
	amountOut: CurrencyAmountDto.schema,
	fee: CurrencyAmountDto.schema,
	durationMs: z.number(),
	blockchainFee: CurrencyAmountDto.schema,
})

export class QuoteSwapResponseDto extends createZodDto(
	quoteSwapResponseSchema,
) {}

export function toQuoteSwapResponseDto(
	result: ZapQuoteSwapResult,
): QuoteSwapResponseDto {
	return {
		amountOut: toPricedCurrencyAmountDto(result.amountOut),
		fee: toPricedCurrencyAmountDto(result.fee),
		durationMs: result.durationMs,
		blockchainFee: toPricedCurrencyAmountDto(
			result.transactionQuote.blockchainFee,
		),
	}
}
