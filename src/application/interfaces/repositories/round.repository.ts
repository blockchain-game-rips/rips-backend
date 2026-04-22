import { CompletedRound, Round } from '../../../domain/entities/round'

export type GetCompletedRoundsArgs = {
	limit: number
	cursor?: number
}

export abstract class RoundRepository {
	abstract getRoundsByIds(ids: Set<number>): Promise<Round[]>

	abstract getCompletedRounds(
		args: GetCompletedRoundsArgs,
	): Promise<CompletedRound[]>

	abstract getNextCompletedRound(
		afterRoundId: number,
	): Promise<CompletedRound | null>
}
