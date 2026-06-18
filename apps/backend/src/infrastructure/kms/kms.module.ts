import { Module } from '@nestjs/common'
import { KmsService } from '../../application/interfaces/kms.service'
import { MetricsModule } from '../metrics/metrics.module'
import { MnemonicKmsService } from './mnemonic-kms.service'

@Module({
	imports: [MetricsModule],
	providers: [{ provide: KmsService, useClass: MnemonicKmsService }],
	exports: [KmsService],
})
export class KmsModule {}
