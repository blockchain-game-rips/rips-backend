import { Injectable } from '@nestjs/common'
import { RipRepository } from '../../interfaces/repositories/rip.repository'
import {
	GetCompletedRipsInput,
	GetCompletedRipsResult,
	GetCompletedRipsUseCase,
} from './get-completed-rips.use-case'

@Injectable()
export class GetCompletedRipsService extends GetCompletedRipsUseCase {
	constructor(private readonly ripRepository: RipRepository) {
		super()
	}

	async execute({
		limit,
		cursor,
	}: GetCompletedRipsInput): Promise<GetCompletedRipsResult> {
		const rips = await this.ripRepository.getCompletedRips({
			limit,
			cursor,
		})

		const nextCursor =
			rips.length === limit ? rips[rips.length - 1].id : null

		return { rips, nextCursor }
	}
}
