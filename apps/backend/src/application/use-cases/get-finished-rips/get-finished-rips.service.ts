import { Injectable } from '@nestjs/common'
import { RipRepository } from '../../interfaces/repositories/rip.repository'
import {
	GetFinishedRipsInput,
	GetFinishedRipsResult,
	GetFinishedRipsUseCase,
} from './get-finished-rips.use-case'

@Injectable()
export class GetFinishedRipsService extends GetFinishedRipsUseCase {
	constructor(private readonly ripRepository: RipRepository) {
		super()
	}

	execute({
		limit,
		cursor,
		userAddress,
	}: GetFinishedRipsInput): Promise<GetFinishedRipsResult> {
		return this.ripRepository.getFinishedRips({
			limit,
			cursor,
			userAddress,
		})
	}
}
