import { CompletedRound, OngoingRound } from 'src/domain/entities/round'

export type GetCompletedRoundsArgs = {
	limit: number
	cursor?: number
}

export abstract class RoundRepository {
	abstract getOngoingRounds(): Promise<OngoingRound[]>
	abstract getCompletedRounds(
		args: GetCompletedRoundsArgs,
	): Promise<CompletedRound[]>
}
