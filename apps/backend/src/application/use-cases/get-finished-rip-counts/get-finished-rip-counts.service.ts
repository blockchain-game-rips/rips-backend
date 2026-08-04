import { Injectable } from '@nestjs/common'
import {
	FinishedRipCounts,
	RipRepository,
} from '../../interfaces/repositories/rip.repository'
import {
	GetFinishedRipCountsInput,
	GetFinishedRipCountsUseCase,
} from './get-finished-rip-counts.use-case'

@Injectable()
export class GetFinishedRipCountsService extends GetFinishedRipCountsUseCase {
	constructor(private readonly ripRepository: RipRepository) {
		super()
	}

	execute({
		userAddress,
	}: GetFinishedRipCountsInput): Promise<FinishedRipCounts> {
		return this.ripRepository.countFinishedRips(userAddress)
	}
}
