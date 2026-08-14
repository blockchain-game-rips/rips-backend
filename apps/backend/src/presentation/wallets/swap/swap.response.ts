import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { CrosschainSwapStartResult } from '../../../domain/value-objects/zap'
import { pendingZapSchema, toPendingZapDto } from '../../shared/pending-zap.dto'
import {
	approvalAttemptSchema,
	toApprovalAttemptDto,
	toTransactionAttemptWithDto,
	transactionAttemptSchema,
} from '../../shared/transaction-attempt.dto'

const swapResponseSchema = z.object({
	approval: approvalAttemptSchema(),
	zap: transactionAttemptSchema(pendingZapSchema),
})

export class SwapResponseDto extends createZodDto(swapResponseSchema) {}

export function toSwapResponseDto(
	result: CrosschainSwapStartResult,
): SwapResponseDto {
	return {
		approval: toApprovalAttemptDto(result.approval),
		zap: toTransactionAttemptWithDto(result.zap, toPendingZapDto),
	}
}
