import { EligibilityPolicyNotFoundError } from '../../../domain/errors/eligibility-policy-not-found.error'

export { EligibilityPolicyNotFoundError }

export abstract class GetTermsDocumentUseCase {
	abstract execute(): Promise<Uint8Array<ArrayBuffer>>
}
