import { Injectable } from '@nestjs/common'
import { UserEligibility } from '../../../domain/entities/eligibility'
import { EligibilityRepository } from '../../interfaces/repositories/eligibility.repository'
import {
	RecordEligibilityInput,
	RecordEligibilityUseCase,
} from './record-eligibility.use-case'

@Injectable()
export class RecordEligibilityService extends RecordEligibilityUseCase {
	constructor(private readonly eligibilityRepository: EligibilityRepository) {
		super()
	}

	// The moment of acceptance is the server's observation, not the caller's
	// claim, so the timestamp is stamped here rather than taken from the body.
	async execute(input: RecordEligibilityInput): Promise<UserEligibility> {
		return this.eligibilityRepository.record({
			telegramId: input.telegramId,
			country: input.country,
			termsVersion: input.termsVersion,
			acceptedAt: new Date(),
		})
	}
}
