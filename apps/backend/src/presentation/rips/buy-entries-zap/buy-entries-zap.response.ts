import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { CrosschainEnterStartResult } from '../../../domain/value-objects/zap'
import { pendingZapSchema, toPendingZapDto } from '../../shared/pending-zap.dto'
import {
	approvalAttemptSchema,
	toApprovalAttemptDto,
	toTransactionAttemptWithDto,
	transactionAttemptSchema,
} from '../../shared/transaction-attempt.dto'

const buyEntriesZapResponseSchema = z.object({
	approval: approvalAttemptSchema(),
	zap: transactionAttemptSchema(pendingZapSchema),
})

export class BuyEntriesZapResponseDto extends createZodDto(
	buyEntriesZapResponseSchema,
) {}

export function toBuyEntriesZapResponseDto(
	result: CrosschainEnterStartResult,
): BuyEntriesZapResponseDto {
	return {
		approval: toApprovalAttemptDto(result.approval),
		zap: toTransactionAttemptWithDto(result.zap, toPendingZapDto),
	}
}
