import { FinishedRip } from '../../../domain/entities/rip'
import { FinishedCursor } from '../../interfaces/repositories/rip.repository'

export type GetFinishedRipsInput = {
	limit: number
	cursor?: FinishedCursor
}

export type GetFinishedRipsResult = {
	rips: FinishedRip[]
	nextCursor: FinishedCursor | null
}

export abstract class GetFinishedRipsUseCase {
	abstract execute(
		input: GetFinishedRipsInput,
	): Promise<GetFinishedRipsResult>
}
