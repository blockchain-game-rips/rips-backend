import { TicketPrize } from '../../../domain/value-objects/ticket-prize'

export type UserPrizes = {
	userId: bigint
	prizes: TicketPrize[]
}

export abstract class RoundSyncRepository {
	abstract getHighestSyncedRoundId(): Promise<number | null>

	abstract syncClaimedRound(args: {
		roundId: number
		entries: UserPrizes[]
	}): Promise<void>

	abstract syncRefundedRound(args: {
		roundId: number
		userIds: bigint[]
	}): Promise<void>
}
