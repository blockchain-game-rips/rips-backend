import { Injectable } from '@nestjs/common'
import { StakeRepository } from 'src/application/interfaces/repositories/stake.repository'
import { Stake } from 'src/domain/entities/stake'
import { GetStakesUseCase } from './get-stakes.use-case'

@Injectable()
export class GetStakesService extends GetStakesUseCase {
	constructor(private readonly stakeRepository: StakeRepository) {
		super()
	}

	execute(): Promise<Stake[]> {
		return this.stakeRepository.getStakes()
	}
}
