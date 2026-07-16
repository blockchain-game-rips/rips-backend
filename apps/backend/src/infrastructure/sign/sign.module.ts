import { Module } from '@nestjs/common'
import { EncryptionModule } from '../encryption/encryption.module'
import { PrismaModule } from '../prisma/prisma.module'
import { SignService } from './sign.service'

@Module({
	imports: [EncryptionModule, PrismaModule],
	providers: [SignService],
	exports: [SignService],
})
export class SignModule {}
