import { OngoingRound } from 'src/domain/entities/round'

export abstract class GetOngoingRoundsUseCase {
	abstract execute(): Promise<OngoingRound[]>
}
