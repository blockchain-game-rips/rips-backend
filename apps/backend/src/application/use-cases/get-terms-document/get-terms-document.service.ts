import { Injectable } from '@nestjs/common'
import { EligibilityRepository } from '../../interfaces/repositories/eligibility.repository'
import {
	EligibilityPolicyNotFoundError,
	GetTermsDocumentUseCase,
} from './get-terms-document.use-case'

@Injectable()
export class GetTermsDocumentService extends GetTermsDocumentUseCase {
	constructor(private readonly eligibilityRepository: EligibilityRepository) {
		super()
	}

	// A zero-byte document is a document: only a missing row is an error.
	async execute(): Promise<Uint8Array<ArrayBuffer>> {
		const document = await this.eligibilityRepository.findTermsDocument()

		if (document === null) {
			throw new EligibilityPolicyNotFoundError(
				'Eligibility policy singleton is missing',
			)
		}

		return document
	}
}
