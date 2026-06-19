import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { EntryPayout } from '../../../domain/value-objects/entry-payout'

const cardSchema = z.object({
	id: z.number(),
	name: z.string(),
	tier: z.number(),
	imageUrl: z.string(),
})

const payoutSchema = z.object({
	ripId: z.number(),
	entryNumber: z.number(),
	payoutAmount: z.string(),
	revealed: z.boolean(),
	card: cardSchema,
})

export class PayoutDto extends createZodDto(payoutSchema) {}

export function toPayoutDto(payout: EntryPayout): PayoutDto {
	return {
		ripId: payout.ripId,
		entryNumber: payout.entryNumber,
		payoutAmount: payout.payoutAmount.toString(),
		revealed: payout.revealed,
		card: {
			id: payout.card.id,
			name: payout.card.name,
			tier: payout.card.tier,
			imageUrl: payout.card.imageUrl,
		},
	}
}
