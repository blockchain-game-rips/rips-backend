import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Purchase } from '../../../domain/value-objects/purchase'
import { TransactionAttemptWith } from '../../../domain/value-objects/transaction-attempt'
import {
	toTransactionAttemptWithDto,
	transactionAttemptSchema,
} from '../../shared/transaction-attempt.dto'
import { purchaseSchema, toPurchaseDto } from '../shared/purchase.dto'

const buyEntriesPurchaseResponseSchema = z.object({
	purchase: transactionAttemptSchema(purchaseSchema),
})

export class BuyEntriesPurchaseResponseDto extends createZodDto(
	buyEntriesPurchaseResponseSchema,
) {}

export function toBuyEntriesPurchaseResponseDto(
	attempt: TransactionAttemptWith<Purchase>,
): BuyEntriesPurchaseResponseDto {
	return {
		purchase: toTransactionAttemptWithDto(attempt, toPurchaseDto),
	}
}
