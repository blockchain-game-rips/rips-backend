import { EligibilityPolicy } from '../../../domain/entities/eligibility'
import { EligibilityPolicyNotFoundError } from '../../../domain/errors/eligibility-policy-not-found.error'

export { EligibilityPolicyNotFoundError }

export abstract class GetEligibilityPolicyUseCase {
	abstract execute(): Promise<EligibilityPolicy>
}
