import { Injectable } from '@nestjs/common'
import { RoundRepository } from '../../interfaces/repositories/round.repository'
import {
	GetRoundsInput,
	GetRoundsResult,
	GetRoundsUseCase,
} from './get-rounds.use-case'

@Injectable()
export class GetRoundsService extends GetRoundsUseCase {
	constructor(private readonly roundRepository: RoundRepository) {
		super()
	}

	async execute({ ids }: GetRoundsInput): Promise<GetRoundsResult> {
		const rounds = await this.roundRepository.getRoundsByIds(ids)

		return { rounds }
	}
}
