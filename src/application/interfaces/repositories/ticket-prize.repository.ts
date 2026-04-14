import { Card } from '../../../domain/value-objects/card'
import { CardCollection } from '../../../domain/value-objects/card-collection'
import { TicketPrize } from '../../../domain/value-objects/ticket-prize'

export abstract class TicketPrizeRepository {
	abstract upsertMany(userId: bigint, prizes: TicketPrize[]): Promise<void>

	abstract getUnrevealed(userId: bigint): Promise<TicketPrize[]>

	/**
	 * @returns return null when there is no prize to reveal
	 */
	abstract revealAndGet(userId: bigint): Promise<TicketPrize | null>

	abstract revealAllAndGet(userId: bigint): Promise<TicketPrize[]>

	abstract getCardCollectionsByStake(
		userId: bigint,
		stakeId: number,
	): Promise<CardCollection[]>

	abstract getCardDefinitionsByStake(stakeId: number): Promise<Card[][]>

	abstract getHighestRoundId(): Promise<number | null>

	abstract saveManyForRound(
		entries: { userId: bigint; prizes: TicketPrize[] }[],
	): Promise<void>
}
