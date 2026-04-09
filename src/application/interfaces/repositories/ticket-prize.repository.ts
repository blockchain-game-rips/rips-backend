import { CardCollection } from 'src/domain/value-objects/card-collection'
import { TicketPrize } from 'src/domain/value-objects/ticket-prize'

export abstract class TicketPrizeRepository {
	abstract upsertMany(userId: bigint, prizes: TicketPrize[]): Promise<void>

	abstract getUnrevealed(userId: bigint): Promise<TicketPrize[]>

	/**
	 * @returns return null when there is no prize to reveal
	 */
	abstract revealAndGet(userId: bigint): Promise<TicketPrize | null>

	abstract revealAllAndGet(userId: bigint): Promise<TicketPrize[]>

	abstract getStakeCardCollections(
		userId: bigint,
		stakeId: number,
	): Promise<CardCollection[]>
}
