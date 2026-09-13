import { Injectable } from '@nestjs/common'
import { UserEligibility } from '../../../domain/entities/eligibility'
import { EligibilityRepository } from '../../interfaces/repositories/eligibility.repository'
import {
	EligibilityNotFoundError,
	GetUserEligibilityInput,
	GetUserEligibilityUseCase,
} from './get-user-eligibility.use-case'

@Injectable()
export class GetUserEligibilityService extends GetUserEligibilityUseCase {
	constructor(private readonly eligibilityRepository: EligibilityRepository) {
		super()
	}

	async execute(input: GetUserEligibilityInput): Promise<UserEligibility> {
		const eligibility = await this.eligibilityRepository.findByTelegramId(
			input.telegramId,
		)

		if (!eligibility) {
			throw new EligibilityNotFoundError(
				`User has never been gated: ${input.telegramId}`,
			)
		}

		return eligibility
	}
}
