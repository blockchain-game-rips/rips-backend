import { TicketPrize } from 'src/domain/entities/ticket-prize'

export type TicketPrizeInput = {
	roundId: number
	ticketNumber: number
	prizeAmount: bigint
}

export abstract class TicketPrizeRepository {
	abstract upsertMany(
		userId: bigint,
		prizes: TicketPrizeInput[],
	): Promise<void>

	abstract getUnrevealed(userId: bigint): Promise<TicketPrize[]>

	abstract revealAndGet(userId: bigint): Promise<TicketPrize | null>

	abstract revealAllAndGet(userId: bigint): Promise<TicketPrize[]>
}
