import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { SamechainEnterResult } from '../../../domain/value-objects/zap'
import {
	approvalAttemptSchema,
	toApprovalAttemptDto,
	toTransactionAttemptWithDto,
	transactionAttemptSchema,
} from '../../shared/transaction-attempt.dto'
import { purchaseSchema, toPurchaseDto } from '../shared/purchase.dto'

const buyEntriesZapSamechainResponseSchema = z.object({
	approval: approvalAttemptSchema(),
	enter: transactionAttemptSchema(purchaseSchema),
})

export class BuyEntriesZapSamechainResponseDto extends createZodDto(
	buyEntriesZapSamechainResponseSchema,
) {}

export function toBuyEntriesZapSamechainResponseDto(
	result: SamechainEnterResult,
): BuyEntriesZapSamechainResponseDto {
	return {
		approval: toApprovalAttemptDto(result.approval),
		enter: toTransactionAttemptWithDto(result.enter, ({ purchase }) =>
			toPurchaseDto(purchase),
		),
	}
}
