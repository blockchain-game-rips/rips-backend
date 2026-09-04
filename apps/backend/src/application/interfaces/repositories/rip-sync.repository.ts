import { EntryPayout } from '../../../domain/value-objects/entry-payout'
import { SettlementKey } from '../../../domain/value-objects/settlement-key'

export abstract class RipSyncRepository {
	abstract getSyncedRipIds(): Promise<number[]>

	/**
	 * Every distinct draw-rules fingerprint recorded by a rip that settled
	 * strictly before the given key — that is, by exactly the rips whose
	 * payouts feed `k` for the draw about to happen.
	 *
	 * Re-checked before every draw so that changing the cards or the biases
	 * under rips that already settled fails loudly instead of quietly moving
	 * later draws.
	 */
	abstract getDrawRulesFingerprintsSettledBefore(
		settlementKey: SettlementKey,
	): Promise<string[]>

	abstract syncClaimedRip(args: {
		ripId: number
		settlementKey: SettlementKey
		drawRulesFingerprint: string
		payouts: EntryPayout[]
	}): Promise<void>

	abstract syncRefundedRip(args: {
		ripId: number
		userIds: bigint[]
	}): Promise<void>
}
