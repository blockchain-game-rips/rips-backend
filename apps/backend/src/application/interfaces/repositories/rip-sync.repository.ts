import { EntryPayout } from '../../../domain/value-objects/entry-payout'

export abstract class RipSyncRepository {
	abstract getHighestSyncedRipId(): Promise<number | null>

	abstract syncClaimedRip(args: {
		ripId: number
		payouts: EntryPayout[]
	}): Promise<void>

	abstract syncRefundedRip(args: {
		ripId: number
		userIds: bigint[]
	}): Promise<void>
}
