import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { PendingZap } from '../../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'
import { toTransactionDto, TransactionDto } from '../../shared/transaction.dto'

const buyEntriesZapResponseSchema = z.object({
	zapId: z.string(),
	srcTransaction: TransactionDto.schema,
	amountIn: CurrencyAmountDto.schema,
	fee: CurrencyAmountDto.schema,
	durationMs: z.number(),
})

export class BuyEntriesZapResponseDto extends createZodDto(
	buyEntriesZapResponseSchema,
) {}

export function toBuyEntriesZapResponseDto(
	pendingZap: PendingZap,
): BuyEntriesZapResponseDto {
	return {
		zapId: pendingZap.zapId,
		srcTransaction: toTransactionDto(pendingZap.srcTransaction),
		amountIn: toPricedCurrencyAmountDto(pendingZap.amountIn),
		fee: toPricedCurrencyAmountDto(pendingZap.fee),
		durationMs: pendingZap.durationMs,
	}
}
