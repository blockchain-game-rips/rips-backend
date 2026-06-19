import { Card } from '../../../domain/value-objects/card'
import { CardCollection } from '../../../domain/value-objects/card-collection'
import { EntryPayout } from '../../../domain/value-objects/entry-payout'
import { EvmAddress } from '../../../domain/value-objects/evm-address'

export abstract class EntryPayoutRepository {
	abstract getUnrevealed(userAddress: EvmAddress): Promise<EntryPayout[]>

	/**
	 * @returns return null when there is no payout to reveal
	 */
	abstract revealAndGet(userAddress: EvmAddress): Promise<EntryPayout | null>

	abstract revealAllAndGet(userAddress: EvmAddress): Promise<EntryPayout[]>

	abstract getCardCollectionsByPreset(
		userAddress: EvmAddress,
		presetId: number,
	): Promise<CardCollection[]>

	abstract getCardDefinitionsByPreset(presetId: number): Promise<Card[][]>
}
