import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { SamechainSwapQuoteResult } from '../../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const quoteSwapSamechainResponseSchema = z.object({
	amountOut: CurrencyAmountDto.schema,
	blockchainFee: CurrencyAmountDto.schema,
})

export class QuoteSwapSamechainResponseDto extends createZodDto(
	quoteSwapSamechainResponseSchema,
) {}

export function toQuoteSwapSamechainResponseDto(
	result: SamechainSwapQuoteResult,
): QuoteSwapSamechainResponseDto {
	return {
		amountOut: toPricedCurrencyAmountDto(result.amountOut),
		blockchainFee: toPricedCurrencyAmountDto(
			result.transactionQuote.blockchainFee,
		),
	}
}
