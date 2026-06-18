import { AvailableStake } from '../../../domain/value-objects/available-stake'

export abstract class GetAvailableStakesUseCase {
	abstract execute(): Promise<AvailableStake[]>
}
