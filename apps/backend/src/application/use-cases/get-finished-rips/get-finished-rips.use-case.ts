import { FinishedRip } from '../../../domain/entities/rip'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { FinishedCursor } from '../../interfaces/repositories/rip.repository'

export type GetFinishedRipsInput = {
	limit: number
	cursor?: FinishedCursor
	userAddress?: EvmAddress
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
