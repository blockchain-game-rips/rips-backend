import { CompletedRound } from '../../../domain/entities/round'

export type GetCompletedRoundsArgs = {
	limit: number
	cursor?: number
}

export abstract class RoundRepository {
	abstract getCompletedRounds(
		args: GetCompletedRoundsArgs,
	): Promise<CompletedRound[]>

	abstract getNextCompletedRound(
		afterRoundId: number,
	): Promise<CompletedRound | null>
}
