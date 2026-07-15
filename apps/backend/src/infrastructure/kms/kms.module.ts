import { Module } from '@nestjs/common'
import { KmsService } from '../../application/interfaces/kms.service'
import { MetricsModule } from '../metrics/metrics.module'
import { FileKmsService } from './file-kms.service'

@Module({
	imports: [MetricsModule],
	providers: [{ provide: KmsService, useClass: FileKmsService }],
	exports: [KmsService],
})
export class KmsModule {}
