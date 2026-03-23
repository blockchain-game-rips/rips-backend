import { Injectable } from '@nestjs/common'
import { RoundRepository } from 'src/application/interfaces/repositories/round.repository'
import { Round } from 'src/domain/entities/round'
import { GetRoundsUseCase } from './get-rounds.use-case'

@Injectable()
export class GetRoundsService extends GetRoundsUseCase {
	constructor(private readonly roundRepository: RoundRepository) {
		super()
	}

	execute(): Promise<Round[]> {
		return this.roundRepository.getRounds()
	}
}
