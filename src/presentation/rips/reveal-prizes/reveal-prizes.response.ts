import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { TicketPrize } from '../../../domain/value-objects/ticket-prize'

const cardSchema = z.object({
	id: z.number(),
	name: z.string(),
	tier: z.number(),
	imageUrl: z.string(),
})

const revealPrizesResponseSchema = z.object({
	roundId: z.number(),
	ticketNumber: z.number(),
	prizeAmount: z.string(),
	revealed: z.boolean(),
	card: cardSchema,
})

export class RevealPrizesResponseDto extends createZodDto(
	revealPrizesResponseSchema,
) {}

export function toRevealPrizesResponseDto(
	prize: TicketPrize,
): RevealPrizesResponseDto {
	return {
		roundId: prize.roundId,
		ticketNumber: prize.ticketNumber,
		prizeAmount: prize.prizeAmount.toString(),
		revealed: prize.revealed,
		card: {
			id: prize.card.id,
			name: prize.card.name,
			tier: prize.card.tier,
			imageUrl: prize.card.imageUrl,
		},
	}
}
