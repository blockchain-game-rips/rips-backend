import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { TransactionQuote } from '../../../domain/value-objects/transaction'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const quoteWithdrawRewardResponseSchema = z.object({
	blockchainFee: CurrencyAmountDto.schema,
})

export class QuoteWithdrawRewardResponseDto extends createZodDto(
	quoteWithdrawRewardResponseSchema,
) {}

export function toQuoteWithdrawRewardResponseDto(
	quote: TransactionQuote,
): QuoteWithdrawRewardResponseDto {
	return {
		blockchainFee: toPricedCurrencyAmountDto(quote.blockchainFee),
	}
}
