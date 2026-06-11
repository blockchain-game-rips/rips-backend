import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { TransactionQuote } from '../../../domain/value-objects/transaction'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const quotePurchaseResponseSchema = z.object({
	blockchainFee: CurrencyAmountDto.schema,
})

export class QuotePurchaseResponseDto extends createZodDto(
	quotePurchaseResponseSchema,
) {}

export function toQuotePurchaseResponseDto(
	quote: TransactionQuote,
): QuotePurchaseResponseDto {
	return {
		blockchainFee: toPricedCurrencyAmountDto(quote.blockchainFee),
	}
}
