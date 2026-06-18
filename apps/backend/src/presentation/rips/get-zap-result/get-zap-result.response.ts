import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ZapBuyResult } from '../../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'
import { toTransactionDto, TransactionDto } from '../../shared/transaction.dto'

const getZapResultResponseSchema = z.object({
	pending: z.object({}).nullable(),
	cancelled: z.object({}).nullable(),
	failed: z.object({ refund: CurrencyAmountDto.schema }).nullable(),
	success: z
		.object({
			dstTransaction: TransactionDto.schema,
			ticketCount: z.number(),
			roundId: z.number(),
		})
		.nullable(),
})

export class GetZapResultResponseDto extends createZodDto(
	getZapResultResponseSchema,
) {}

export function toGetZapResultResponseDto(
	result: ZapBuyResult | null,
): GetZapResultResponseDto {
	const base = { pending: null, cancelled: null, failed: null, success: null }

	if (result === null) {
		return { ...base, pending: {} }
	}

	if (result.status === 'cancelled') {
		return { ...base, cancelled: {} }
	}

	if (result.status === 'failed') {
		return {
			...base,
			failed: {
				refund: toPricedCurrencyAmountDto(result.refund),
			},
		}
	}

	return {
		...base,
		success: {
			dstTransaction: toTransactionDto(result.dstTransaction),
			ticketCount: result.result.ticketCount,
			roundId: result.result.roundId,
		},
	}
}
