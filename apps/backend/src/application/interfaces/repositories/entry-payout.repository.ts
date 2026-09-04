import { Card } from '../../../domain/value-objects/card'
import { CardCollection } from '../../../domain/value-objects/card-collection'
import { EntryPayout } from '../../../domain/value-objects/entry-payout'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { PayoutFilter } from '../../../domain/value-objects/payout-filter'
import { SettlementKey } from '../../../domain/value-objects/settlement-key'

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

	/**
	 * The user collection as it stood before the given rip settled: every
	 * payout, revealed or not, from a rip with a strictly smaller settlement
	 * key. Counting unrevealed payouts too keeps a withheld reveal from
	 * biasing later draws.
	 */
	abstract getAssignedCardCollections(
		userAddress: EvmAddress,
		settlementKey: SettlementKey,
	): Promise<CardCollection[]>

	/**
	 * Counts only revealed payouts — what the user has actually turned face-up.
	 */
	abstract getRevealedCardCollections(
		userAddress: EvmAddress,
	): Promise<CardCollection[]>

	abstract getCardDefinitions(): Promise<Card[][]>
}
