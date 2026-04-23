import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { PendingZap } from '../../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toCurrencyAmountDto,
} from '../../shared/currency-amount.dto'
import { toTransactionDto, TransactionDto } from '../../shared/transaction.dto'

const createWithdrawalZapResponseSchema = z.object({
	zapId: z.string(),
	srcTransaction: TransactionDto.schema,
	amountIn: CurrencyAmountDto.schema,
	fee: CurrencyAmountDto.schema,
	durationMs: z.number(),
})

export class CreateWithdrawalZapResponseDto extends createZodDto(
	createWithdrawalZapResponseSchema,
) {}

export function toCreateWithdrawalZapResponseDto(
	pendingZap: PendingZap,
	amountInPriceUsd: number,
	feePriceUsd: number,
): CreateWithdrawalZapResponseDto {
	return {
		zapId: pendingZap.zapId,
		srcTransaction: toTransactionDto(pendingZap.srcTransaction),
		amountIn: toCurrencyAmountDto(pendingZap.amountIn, amountInPriceUsd),
		fee: toCurrencyAmountDto(pendingZap.fee, feePriceUsd),
		durationMs: pendingZap.durationMs,
	}
}
