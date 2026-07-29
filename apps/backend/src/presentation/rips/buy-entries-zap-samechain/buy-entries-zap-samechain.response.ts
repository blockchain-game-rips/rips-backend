import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { SamechainEnterResult } from '../../../domain/value-objects/zap'
import { toTransactionDto, TransactionDto } from '../../shared/transaction.dto'
import { purchaseSchema, toPurchaseDto } from '../shared/purchase.dto'

const buyEntriesZapSamechainResponseSchema = z.object({
	transaction: TransactionDto.schema,
	...purchaseSchema.shape,
})

export class BuyEntriesZapSamechainResponseDto extends createZodDto(
	buyEntriesZapSamechainResponseSchema,
) {}

export function toBuyEntriesZapSamechainResponseDto(
	result: SamechainEnterResult,
): BuyEntriesZapSamechainResponseDto {
	return {
		transaction: toTransactionDto(result.transaction),
		...toPurchaseDto(result.purchase),
	}
}
