import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { PurchaseReceipt } from '../../domain/value-objects/purchase-receipt'
import { PendingZap } from '../../domain/value-objects/zap'
import { toPlainCurrencyAmount, toPlainTransaction } from '../to-plain'
import { CurrencyAmountDto, TransactionDto } from '../to-plain-schemas'

const PurchaseResponseZ = z.object({
	transaction: TransactionDto.schema,
	roundId: z.number(),
	ticketCount: z.number(),
})

const ZapResponseZ = z.object({
	zapId: z.string(),
	srcTransaction: TransactionDto.schema,
	amountIn: CurrencyAmountDto.schema,
	fee: CurrencyAmountDto.schema,
	durationMs: z.number(),
})

export class PurchaseResponseDto extends createZodDto(PurchaseResponseZ) {}
export class ZapResponseDto extends createZodDto(ZapResponseZ) {}

export function toPurchaseResponseDto(
	receipt: PurchaseReceipt,
): PurchaseResponseDto {
	return {
		transaction: toPlainTransaction(receipt.transaction),
		roundId: receipt.purchase.roundId,
		ticketCount: receipt.purchase.ticketCount,
	}
}

export function toZapResponseDto(
	pendingZap: PendingZap,
	amountInPriceUsd: number,
	feePriceUsd: number,
): ZapResponseDto {
	return {
		zapId: pendingZap.zapId,
		srcTransaction: toPlainTransaction(pendingZap.srcTransaction),
		amountIn: toPlainCurrencyAmount(pendingZap.amountIn, amountInPriceUsd),
		fee: toPlainCurrencyAmount(pendingZap.fee, feePriceUsd),
		durationMs: pendingZap.durationMs,
	}
}
