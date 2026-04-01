import { Injectable } from '@nestjs/common'
import { RoundRepository } from 'src/application/interfaces/repositories/round.repository'
import { OngoingRound } from 'src/domain/entities/round'
import { GetOngoingRoundsUseCase } from './get-ongoing-rounds.use-case'

@Injectable()
export class GetOngoingRoundsService extends GetOngoingRoundsUseCase {
	constructor(private readonly roundRepository: RoundRepository) {
		super()
	}

	execute(): Promise<OngoingRound[]> {
		return this.roundRepository.getOngoingRounds()
	}
}
