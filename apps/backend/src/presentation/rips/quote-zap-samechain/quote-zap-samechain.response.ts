import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { SamechainEnterQuoteResult } from '../../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const quoteZapSamechainResponseSchema = z.object({
	amountIn: CurrencyAmountDto.schema,
	blockchainFee: CurrencyAmountDto.schema,
})

export class QuoteZapSamechainResponseDto extends createZodDto(
	quoteZapSamechainResponseSchema,
) {}

export function toQuoteZapSamechainResponseDto(
	quote: SamechainEnterQuoteResult,
): QuoteZapSamechainResponseDto {
	return {
		amountIn: toPricedCurrencyAmountDto(quote.amountIn),
		blockchainFee: toPricedCurrencyAmountDto(
			quote.transactionQuote.blockchainFee,
		),
	}
}
