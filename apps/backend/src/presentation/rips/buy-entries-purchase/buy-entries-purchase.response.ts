import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { PurchaseReceipt } from '../../../domain/value-objects/purchase-receipt'
import { toTransactionDto, TransactionDto } from '../../shared/transaction.dto'
import { purchaseSchema, toPurchaseDto } from '../shared/purchase.dto'

const buyEntriesPurchaseResponseSchema = z.object({
	transaction: TransactionDto.schema,
	...purchaseSchema.shape,
})

export class BuyEntriesPurchaseResponseDto extends createZodDto(
	buyEntriesPurchaseResponseSchema,
) {}

export function toBuyEntriesPurchaseResponseDto(
	receipt: PurchaseReceipt,
): BuyEntriesPurchaseResponseDto {
	return {
		transaction: toTransactionDto(receipt.transaction),
		...toPurchaseDto(receipt.purchase),
	}
}
