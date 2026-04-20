import { Card } from '../../../domain/value-objects/card'
import { CardCollection } from '../../../domain/value-objects/card-collection'
import { TicketPrize } from '../../../domain/value-objects/ticket-prize'

export abstract class TicketPrizeRepository {
	abstract getUnrevealed(userAddress: string): Promise<TicketPrize[]>

	/**
	 * @returns return null when there is no prize to reveal
	 */
	abstract revealAndGet(userAddress: string): Promise<TicketPrize | null>

	abstract revealAllAndGet(userAddress: string): Promise<TicketPrize[]>

	abstract getCardCollectionsByStake(
		userAddres: string,
		stakeId: number,
	): Promise<CardCollection[]>

	abstract getCardDefinitionsByStake(stakeId: number): Promise<Card[][]>
}
