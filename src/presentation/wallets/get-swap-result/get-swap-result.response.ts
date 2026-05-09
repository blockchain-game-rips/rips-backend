import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ZapSwapResult } from '../../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toCurrencyAmountDto,
} from '../../shared/currency-amount.dto'
import { toTransactionDto, TransactionDto } from '../../shared/transaction.dto'

const getSwapResultResponseSchema = z.object({
	pending: z.object({}).nullable(),
	cancelled: z.object({}).nullable(),
	failed: z.object({ refund: CurrencyAmountDto.schema }).nullable(),
	success: z
		.object({
			dstTransaction: TransactionDto.schema,
			amountOut: CurrencyAmountDto.schema,
		})
		.nullable(),
})

export class GetSwapResultResponseDto extends createZodDto(
	getSwapResultResponseSchema,
) {}

const base = { pending: null, cancelled: null, failed: null, success: null }

export const pendingSwapResultDto: GetSwapResultResponseDto = {
	...base,
	pending: {},
}

export const cancelledSwapResultDto: GetSwapResultResponseDto = {
	...base,
	cancelled: {},
}

export function toFailedSwapResultDto(
	refundPriceUsd: number,
	refund: ZapSwapResult & { status: 'failed' },
): GetSwapResultResponseDto {
	return {
		...base,
		failed: {
			refund: toCurrencyAmountDto(refund.refund, refundPriceUsd),
		},
	}
}

export function toSuccessSwapResultDto(
	amountOutPriceUsd: number,
	result: ZapSwapResult & { status: 'success' },
): GetSwapResultResponseDto {
	return {
		...base,
		success: {
			dstTransaction: toTransactionDto(result.dstTransaction),
			amountOut: toCurrencyAmountDto(
				result.result.amountOut,
				amountOutPriceUsd,
			),
		},
	}
}
