import { Injectable } from '@nestjs/common'
import { EligibilityPolicy } from '../../../domain/entities/eligibility'
import { EligibilityRepository } from '../../interfaces/repositories/eligibility.repository'
import {
	SetBlockedCountriesInput,
	SetBlockedCountriesUseCase,
} from './set-blocked-countries.use-case'

@Injectable()
export class SetBlockedCountriesService extends SetBlockedCountriesUseCase {
	constructor(private readonly eligibilityRepository: EligibilityRepository) {
		super()
	}

	async execute(input: SetBlockedCountriesInput): Promise<EligibilityPolicy> {
		return this.eligibilityRepository.replaceBlockedCountries(
			input.blockedCountries,
		)
	}
}
