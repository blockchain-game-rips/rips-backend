import { Round } from '../../../domain/entities/round'

export type GetRoundsInput = {
	ids: Set<number>
}

export type GetRoundsResult = {
	rounds: Round[]
}

export abstract class GetRoundsUseCase {
	abstract execute(input: GetRoundsInput): Promise<GetRoundsResult>
}
