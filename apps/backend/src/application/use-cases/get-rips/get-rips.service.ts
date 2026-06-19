import { Injectable } from '@nestjs/common'
import { RipRepository } from '../../interfaces/repositories/rip.repository'
import {
	GetRipsInput,
	GetRipsResult,
	GetRipsUseCase,
} from './get-rips.use-case'

@Injectable()
export class GetRipsService extends GetRipsUseCase {
	constructor(private readonly ripRepository: RipRepository) {
		super()
	}

	async execute({ ids }: GetRipsInput): Promise<GetRipsResult> {
		const rips = await this.ripRepository.getRipsByIds(ids)

		return { rips }
	}
}
