import { StakeWithRounds } from 'src/domain/value-objects/stake-with-rounds'

export abstract class StakeRepository {
	abstract getStakesWithRounds(): Promise<StakeWithRounds[]>
}
