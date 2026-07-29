import { z } from 'zod'
import { Purchase } from '../../../domain/value-objects/purchase'

export const startEntryIndexSchema = z
	.number()
	.describe(
		'Index of the first entry bought. This purchase owns entries ' +
			'startEntryIndex through startEntryIndex + entryCount - 1.',
	)

export const purchaseSchema = z.object({
	ripId: z.number(),
	entryCount: z.number(),
	startEntryIndex: startEntryIndexSchema,
})

export function toPurchaseDto(
	purchase: Purchase,
): z.infer<typeof purchaseSchema> {
	return {
		ripId: purchase.ripId,
		entryCount: purchase.entryCount,
		startEntryIndex: purchase.startEntryIndex,
	}
}
