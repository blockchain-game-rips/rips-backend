import { AvailableStake } from 'src/domain/value-objects/available-stake'

export abstract class GetAvailableStakesUseCase {
	abstract execute(): Promise<AvailableStake[]>
}
