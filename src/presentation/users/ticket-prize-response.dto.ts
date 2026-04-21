import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Card } from '../../domain/value-objects/card'
import { TicketPrize } from '../../domain/value-objects/ticket-prize'

const CardZ = z.object({
	id: z.number(),
	name: z.string(),
	tier: z.number(),
	imageUrl: z.string(),
})

const TicketPrizeResponseZ = z.object({
	roundId: z.number(),
	ticketNumber: z.number(),
	prizeAmount: z.string(),
	revealed: z.boolean(),
	card: CardZ,
})

export class TicketPrizeResponseDto extends createZodDto(
	TicketPrizeResponseZ,
) {}

function toCardDto(card: Card): z.infer<typeof CardZ> {
	return {
		id: card.id,
		name: card.name,
		tier: card.tier,
		imageUrl: card.imageUrl,
	}
}

export function toTicketPrizeResponseDto(
	prize: TicketPrize,
): TicketPrizeResponseDto {
	return {
		roundId: prize.roundId,
		ticketNumber: prize.ticketNumber,
		prizeAmount: prize.prizeAmount.toString(),
		revealed: prize.revealed,
		card: toCardDto(prize.card),
	}
}
