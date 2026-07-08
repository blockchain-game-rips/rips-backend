import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { SamechainEnterResult } from '../../../domain/value-objects/zap'
import { toTransactionDto, TransactionDto } from '../../shared/transaction.dto'

const buyEntriesZapSamechainResponseSchema = z.object({
	transaction: TransactionDto.schema,
	entryCount: z.number(),
	ripId: z.number(),
})

export class BuyEntriesZapSamechainResponseDto extends createZodDto(
	buyEntriesZapSamechainResponseSchema,
) {}

export function toBuyEntriesZapSamechainResponseDto(
	result: SamechainEnterResult,
): BuyEntriesZapSamechainResponseDto {
	return {
		transaction: toTransactionDto(result.transaction),
		entryCount: result.purchase.entryCount,
		ripId: result.purchase.ripId,
	}
}
