import { OngoingRip } from '../../../domain/entities/rip'

export abstract class GetOngoingRipsUseCase {
	abstract execute(): Promise<OngoingRip[]>
}
