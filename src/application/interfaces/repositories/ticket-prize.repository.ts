import { Card } from '../../../domain/value-objects/card'
import { CardCollection } from '../../../domain/value-objects/card-collection'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { TicketPrize } from '../../../domain/value-objects/ticket-prize'

export abstract class TicketPrizeRepository {
	abstract getUnrevealed(userAddress: EvmAddress): Promise<TicketPrize[]>

	/**
	 * @returns return null when there is no prize to reveal
	 */
	abstract revealAndGet(userAddress: EvmAddress): Promise<TicketPrize | null>

	abstract revealAllAndGet(userAddress: EvmAddress): Promise<TicketPrize[]>

	abstract getCardCollectionsByStake(
		userAddress: EvmAddress,
		stakeId: number,
	): Promise<CardCollection[]>

	abstract getCardDefinitionsByStake(stakeId: number): Promise<Card[][]>
}
