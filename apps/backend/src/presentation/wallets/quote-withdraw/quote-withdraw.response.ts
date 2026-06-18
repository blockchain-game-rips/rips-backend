import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { TransactionQuote } from '../../../domain/value-objects/transaction'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const quoteWithdrawResponseSchema = z.object({
	blockchainFee: CurrencyAmountDto.schema,
})

export class QuoteWithdrawResponseDto extends createZodDto(
	quoteWithdrawResponseSchema,
) {}

export function toQuoteWithdrawResponseDto(
	quote: TransactionQuote,
): QuoteWithdrawResponseDto {
	return {
		blockchainFee: toPricedCurrencyAmountDto(quote.blockchainFee),
	}
}
