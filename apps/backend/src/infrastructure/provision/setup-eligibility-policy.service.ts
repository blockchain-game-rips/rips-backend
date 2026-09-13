import { Injectable, Logger } from '@nestjs/common'
import { EligibilityRepository } from '../../application/interfaces/repositories/eligibility.repository'

/**
 * Brings the eligibility policy singleton into existence as an initial-setup
 * step. The terms document is an input rather than a default: the row cannot
 * exist without a real document, so no placeholder is ever written.
 *
 * Replacing the document in a running system is the admin route's job, not
 * this one's — re-running setup leaves an established policy alone.
 */
@Injectable()
export class SetupEligibilityPolicyService {
	private readonly logger = new Logger(SetupEligibilityPolicyService.name)

	constructor(
		private readonly eligibilityRepository: EligibilityRepository,
	) {}

	async setup(termsDocument: Uint8Array<ArrayBuffer>): Promise<void> {
		if (termsDocument.byteLength === 0) {
			throw new Error(
				'Refusing to set up the eligibility policy with an empty terms document.',
			)
		}

		const existing = await this.eligibilityRepository.findPolicy()

		if (existing) {
			this.logger.log(
				`Eligibility policy already set up at terms version ${existing.termsVersion}.`,
			)

			return
		}

		const policy =
			await this.eligibilityRepository.replaceTermsDocument(termsDocument)

		this.logger.log(
			`Eligibility policy set up at terms version ${policy.termsVersion}, blocking no countries.`,
		)
	}
}
