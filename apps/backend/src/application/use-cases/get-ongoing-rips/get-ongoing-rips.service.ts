import { Injectable } from '@nestjs/common'
import { OngoingRip } from '../../../domain/entities/rip'
import { RipRepository } from '../../interfaces/repositories/rip.repository'
import { GetOngoingRipsUseCase } from './get-ongoing-rips.use-case'

@Injectable()
export class GetOngoingRipsService extends GetOngoingRipsUseCase {
	constructor(private readonly ripRepository: RipRepository) {
		super()
	}

	execute(): Promise<OngoingRip[]> {
		return this.ripRepository.getOngoingRips()
	}
}
