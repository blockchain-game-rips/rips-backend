import { Module } from '@nestjs/common'
import { KmsService } from 'src/application/interfaces/kms.service'
import { AwsKmsService } from './kms.service'

@Module({
	providers: [{ provide: KmsService, useClass: AwsKmsService }],
	exports: [KmsService],
})
export class KmsModule {}
