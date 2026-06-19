import { CompletedRip } from '../../../domain/entities/rip'

export type GetCompletedRipsInput = {
	limit: number
	cursor?: number
}

export type GetCompletedRipsResult = {
	rips: CompletedRip[]
	nextCursor: number | null
}

export abstract class GetCompletedRipsUseCase {
	abstract execute(
		input: GetCompletedRipsInput,
	): Promise<GetCompletedRipsResult>
}
