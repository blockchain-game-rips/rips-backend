import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { PurchaseReceipt } from '../../../domain/value-objects/purchase-receipt'
import { toTransactionDto, TransactionDto } from '../../shared/transaction.dto'

const buyTicketsPurchaseResponseSchema = z.object({
	transaction: TransactionDto.schema,
	roundId: z.number(),
	ticketCount: z.number(),
})

export class BuyTicketsPurchaseResponseDto extends createZodDto(
	buyTicketsPurchaseResponseSchema,
) {}

export function toBuyTicketsPurchaseResponseDto(
	receipt: PurchaseReceipt,
): BuyTicketsPurchaseResponseDto {
	return {
		transaction: toTransactionDto(receipt.transaction),
		roundId: receipt.purchase.roundId,
		ticketCount: receipt.purchase.ticketCount,
	}
}
