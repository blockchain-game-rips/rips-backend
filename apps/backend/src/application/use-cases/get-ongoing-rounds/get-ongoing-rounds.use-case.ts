import { OngoingRound } from '../../../domain/entities/round'

export abstract class GetOngoingRoundsUseCase {
	abstract execute(): Promise<OngoingRound[]>
}
