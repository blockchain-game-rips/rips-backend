import { Module } from '@nestjs/common'
import { KmsService } from '../../application/interfaces/kms.service'
import { MnemonicKmsService } from './mnemonic-kms.service'

@Module({
	providers: [{ provide: KmsService, useClass: MnemonicKmsService }],
	exports: [KmsService],
})
export class KmsModule {}
