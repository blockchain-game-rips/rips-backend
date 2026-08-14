import { z } from 'zod'
import { PendingZap } from '../../domain/value-objects/zap'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from './currency-amount.dto'

export const pendingZapSchema = z.object({
	zapId: z.string(),
	amountIn: CurrencyAmountDto.schema,
	fee: CurrencyAmountDto.schema,
	durationMs: z.number(),
})

export function toPendingZapDto(
	pendingZap: PendingZap,
): z.infer<typeof pendingZapSchema> {
	return {
		zapId: pendingZap.zapId,
		amountIn: toPricedCurrencyAmountDto(pendingZap.amountIn),
		fee: toPricedCurrencyAmountDto(pendingZap.fee),
		durationMs: pendingZap.durationMs,
	}
}
