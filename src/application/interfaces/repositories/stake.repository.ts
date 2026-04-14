import { StakeWithOngoingRounds } from '../../../domain/value-objects/stake-with-ongoing-rounds'

export abstract class StakeRepository {
	abstract getStakesWithOngoingRounds(): Promise<StakeWithOngoingRounds[]>
}
