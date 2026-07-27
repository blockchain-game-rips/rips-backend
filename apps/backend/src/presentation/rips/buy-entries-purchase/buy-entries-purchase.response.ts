import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { PurchaseReceipt } from '../../../domain/value-objects/purchase-receipt'
import { toTransactionDto, TransactionDto } from '../../shared/transaction.dto'

const buyEntriesPurchaseResponseSchema = z.object({
	transaction: TransactionDto.schema,
	ripId: z.number(),
	entryCount: z.number(),
	startEntryIndex: z.number(),
})

export class BuyEntriesPurchaseResponseDto extends createZodDto(
	buyEntriesPurchaseResponseSchema,
) {}

export function toBuyEntriesPurchaseResponseDto(
	receipt: PurchaseReceipt,
): BuyEntriesPurchaseResponseDto {
	return {
		transaction: toTransactionDto(receipt.transaction),
		ripId: receipt.purchase.ripId,
		entryCount: receipt.purchase.entryCount,
		startEntryIndex: receipt.purchase.startEntryIndex,
	}
}
