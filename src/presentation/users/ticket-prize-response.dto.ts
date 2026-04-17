import { Card } from '../../domain/value-objects/card'
import { TicketPrize } from '../../domain/value-objects/ticket-prize'

type CardDto = {
	id: number
	name: string
	tier: number
	imageUrl: string
}

export type TicketPrizeResponseDto = {
	roundId: number
	ticketNumber: number
	prizeAmount: string
	revealed: boolean
	card: CardDto
}

function toCardDto(card: Card): CardDto {
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
