import { CompletedRound } from '../../../domain/entities/round'

export type GetCompletedRoundsInput = {
	limit: number
	cursor?: number
}

export type GetCompletedRoundsResult = {
	rounds: CompletedRound[]
	nextCursor: number | null
}

export abstract class GetCompletedRoundsUseCase {
	abstract execute(
		input: GetCompletedRoundsInput,
	): Promise<GetCompletedRoundsResult>
}
