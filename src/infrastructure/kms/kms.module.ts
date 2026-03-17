import { Module } from '@nestjs/common'
import { KMS_SERVICE_TOKEN } from 'src/application/interfaces/kms.service'
import { AwsKmsService } from './kms.service'

@Module({
	providers: [
		AwsKmsService,
		{ provide: KMS_SERVICE_TOKEN, useExisting: AwsKmsService },
	],
	exports: [KMS_SERVICE_TOKEN],
})
export class KmsModule {}
