import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Transaction } from '../../domain/value-objects/transaction'
import { CurrencyAmountDto, toCurrencyAmountDto } from './currency-amount.dto'

const transactionSchema = z.object({
	id: z.string(),
	cost: CurrencyAmountDto.schema.optional(),
})

export class TransactionDto extends createZodDto(transactionSchema) {}

export function toTransactionDto(
	tx: Transaction,
	costPriceUsd?: number,
): TransactionDto {
	return {
		id: tx.id,
		cost:
			tx.cost !== undefined
				? toCurrencyAmountDto(tx.cost, costPriceUsd ?? 0)
				: undefined,
	}
}
