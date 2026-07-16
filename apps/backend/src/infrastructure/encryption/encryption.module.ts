import { Module } from '@nestjs/common'
import { EncryptionService } from '../../application/interfaces/encryption.service'
import { FileEncryptionService } from './file-encryption.service'

@Module({
	providers: [
		{ provide: EncryptionService, useClass: FileEncryptionService },
	],
	exports: [EncryptionService],
})
export class EncryptionModule {}
