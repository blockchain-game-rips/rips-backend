import { Injectable } from '@nestjs/common'
import { EligibilityPolicy } from '../../../domain/entities/eligibility'
import { EligibilityRepository } from '../../interfaces/repositories/eligibility.repository'
import {
	EligibilityPolicyNotFoundError,
	GetEligibilityPolicyUseCase,
} from './get-eligibility-policy.use-case'

@Injectable()
export class GetEligibilityPolicyService extends GetEligibilityPolicyUseCase {
	constructor(private readonly eligibilityRepository: EligibilityRepository) {
		super()
	}

	async execute(): Promise<EligibilityPolicy> {
		const policy = await this.eligibilityRepository.findPolicy()

		if (!policy) {
			throw new EligibilityPolicyNotFoundError(
				'Eligibility policy singleton is missing',
			)
		}

		return policy
	}
}
