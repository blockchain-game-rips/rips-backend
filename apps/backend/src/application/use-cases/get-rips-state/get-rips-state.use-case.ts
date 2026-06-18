import { RipsState } from '../../../domain/value-objects/rips-state'

export abstract class GetRipsStateUseCase {
	abstract execute(): Promise<RipsState>
}
