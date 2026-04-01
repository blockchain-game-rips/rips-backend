import { Injectable } from '@nestjs/common'
import { RoundRepository } from 'src/application/interfaces/repositories/round.repository'
import {
	GetCompletedRoundsInput,
	GetCompletedRoundsResult,
	GetCompletedRoundsUseCase,
} from './get-completed-rounds.use-case'

@Injectable()
export class GetCompletedRoundsService extends GetCompletedRoundsUseCase {
	constructor(private readonly roundRepository: RoundRepository) {
		super()
	}

	async execute({
		limit,
		cursor,
	}: GetCompletedRoundsInput): Promise<GetCompletedRoundsResult> {
		const rounds = await this.roundRepository.getCompletedRounds({
			limit,
			cursor,
		})

		const nextCursor =
			rounds.length === limit ? rounds[rounds.length - 1].id : null

		return { rounds, nextCursor }
	}
}
