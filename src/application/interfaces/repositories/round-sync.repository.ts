import { TicketPrize } from '../../../domain/value-objects/ticket-prize'

export abstract class RoundSyncRepository {
	abstract getHighestSyncedRoundId(): Promise<number | null>

	abstract syncClaimedRound(args: {
		roundId: number
		prizes: TicketPrize[]
	}): Promise<void>

	abstract syncRefundedRound(args: {
		roundId: number
		userIds: bigint[]
	}): Promise<void>
}
