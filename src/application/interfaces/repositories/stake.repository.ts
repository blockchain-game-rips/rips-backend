import { Stake } from 'src/domain/entities/stake'

export abstract class StakeRepository {
	abstract getStakes(): Promise<Stake[]>
}
