import { EligibilityPolicy } from '../../../domain/entities/eligibility'

export type UploadTermsDocumentInput = {
	termsFile: Uint8Array<ArrayBuffer>
}

export abstract class UploadTermsDocumentUseCase {
	abstract execute(
		input: UploadTermsDocumentInput,
	): Promise<EligibilityPolicy>
}
