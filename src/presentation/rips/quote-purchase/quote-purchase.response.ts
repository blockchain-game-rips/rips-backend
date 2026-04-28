import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { CurrencyId } from '../../../domain/value-objects/currency-id'
import { TransactionQuote } from '../../../domain/value-objects/transaction'
import {
	CurrencyAmountDto,
	toCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const quotePurchaseResponseSchema = z.object({
	blockchainFee: CurrencyAmountDto.schema,
})

export class QuotePurchaseResponseDto extends createZodDto(
	quotePurchaseResponseSchema,
) {}

export function toQuotePurchaseResponseDto(
	quote: TransactionQuote,
	prices: Map<CurrencyId, number>,
): QuotePurchaseResponseDto {
	return {
		blockchainFee: toCurrencyAmountDto(
			quote.blockchainFee,
			prices.get(quote.blockchainFee.currency.id) ?? 0,
		),
	}
}
