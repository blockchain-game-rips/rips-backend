import { Injectable } from '@nestjs/common'
import { EligibilityPolicy } from '../../../domain/entities/eligibility'
import { EligibilityRepository } from '../../interfaces/repositories/eligibility.repository'
import {
	UploadTermsDocumentInput,
	UploadTermsDocumentUseCase,
} from './upload-terms-document.use-case'

@Injectable()
export class UploadTermsDocumentService extends UploadTermsDocumentUseCase {
	constructor(private readonly eligibilityRepository: EligibilityRepository) {
		super()
	}

	async execute(input: UploadTermsDocumentInput): Promise<EligibilityPolicy> {
		return this.eligibilityRepository.replaceTermsDocument(input.termsFile)
	}
}
