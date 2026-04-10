import { CompletedRound } from 'src/domain/entities/round'

export type GetCompletedRoundsArgs = {
	limit: number
	cursor?: number
}

export abstract class RoundRepository {
	abstract getCompletedRounds(
		args: GetCompletedRoundsArgs,
	): Promise<CompletedRound[]>

	abstract getNextClaimedRound(
		afterRoundId: number,
	): Promise<CompletedRound | null>
}
