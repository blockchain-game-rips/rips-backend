import { Module } from '@nestjs/common'
import { EligibilityController } from '../../../presentation/eligibility/eligibility.controller'
import { GetEligibilityPolicyModule } from '../../use-cases/get-eligibility-policy.module'
import { GetUserEligibilityModule } from '../../use-cases/get-user-eligibility.module'
import { RecordEligibilityModule } from '../../use-cases/record-eligibility.module'
import { SetBlockedCountriesModule } from '../../use-cases/set-blocked-countries.module'
import { UploadTermsDocumentModule } from '../../use-cases/upload-terms-document.module'

@Module({
	imports: [
		GetEligibilityPolicyModule,
		GetUserEligibilityModule,
		RecordEligibilityModule,
		SetBlockedCountriesModule,
		UploadTermsDocumentModule,
	],
	controllers: [EligibilityController],
})
export class EligibilityApiModule {}
