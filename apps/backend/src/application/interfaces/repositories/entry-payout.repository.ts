import { Card } from '../../../domain/value-objects/card'
import { CardCollection } from '../../../domain/value-objects/card-collection'
import { EntryPayout } from '../../../domain/value-objects/entry-payout'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { PayoutFilter } from '../../../domain/value-objects/payout-filter'

export abstract class EntryPayoutRepository {
	abstract find(
		userAddress: EvmAddress,
		filter: PayoutFilter,
	): Promise<EntryPayout[]>

	/**
	 * @returns return null when there is no payout to reveal
	 */
	abstract revealAndGet(userAddress: EvmAddress): Promise<EntryPayout | null>

	abstract revealAllAndGet(userAddress: EvmAddress): Promise<EntryPayout[]>

	abstract getCardCollections(
		userAddress: EvmAddress,
	): Promise<CardCollection[]>

	abstract getCardDefinitions(): Promise<Card[][]>
}
