import { Stake } from 'src/domain/entities/stake'

export abstract class GetStakesUseCase {
	abstract execute(): Promise<Stake[]>
}
