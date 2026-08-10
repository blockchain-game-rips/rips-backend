import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Transaction } from '../../domain/value-objects/transaction'
import { ChainDto, toChainDto } from './chain-address.dto'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from './currency-amount.dto'

const transactionSchema = z
	.object({
		chain: ChainDto.schema,
		id: z.string(),
		senderAddress: z.string(),
		cost: CurrencyAmountDto.schema,
	})
	.meta({ id: 'TransactionDto' })

export class TransactionDto extends createZodDto(transactionSchema) {}

export function toTransactionDto(tx: Transaction): TransactionDto {
	return {
		chain: toChainDto(tx.chain),
		id: tx.id,
		senderAddress: tx.senderAddress,
		cost: toPricedCurrencyAmountDto(tx.cost),
	}
}
