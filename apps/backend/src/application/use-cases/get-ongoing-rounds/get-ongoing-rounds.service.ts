import { Injectable } from '@nestjs/common'
import { OngoingRound } from '../../../domain/entities/round'
import { StakeRepository } from '../../interfaces/repositories/stake.repository'
import { GetOngoingRoundsUseCase } from './get-ongoing-rounds.use-case'

@Injectable()
export class GetOngoingRoundsService extends GetOngoingRoundsUseCase {
	constructor(private readonly stakeRepository: StakeRepository) {
		super()
	}

	async execute(): Promise<OngoingRound[]> {
		const stakesWithRounds =
			await this.stakeRepository.getStakesWithOngoingRounds()

		return stakesWithRounds.flatMap(({ ongoingRounds }) => ongoingRounds)
	}
}
