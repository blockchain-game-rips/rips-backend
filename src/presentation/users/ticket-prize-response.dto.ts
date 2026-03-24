import { TicketPrize } from 'src/domain/entities/ticket-prize'

export type TicketPrizeResponseDto = {
	ticketNumber: number
	prizeAmount: string
}

export function toTicketPrizeResponseDto(
	prize: TicketPrize,
): TicketPrizeResponseDto {
	return {
		ticketNumber: prize.ticketNumber,
		prizeAmount: prize.prizeAmount.toString(),
	}
}
