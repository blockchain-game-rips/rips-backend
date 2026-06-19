import { Rip } from '../../../domain/entities/rip'

export type GetRipsInput = {
	ids: Set<number>
}

export type GetRipsResult = {
	rips: Rip[]
}

export abstract class GetRipsUseCase {
	abstract execute(input: GetRipsInput): Promise<GetRipsResult>
}
