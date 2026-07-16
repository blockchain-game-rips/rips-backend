import { Module } from '@nestjs/common'
import { EncryptionModule } from '../encryption/encryption.module'
import { PrismaModule } from '../prisma/prisma.module'
import { RipsModule } from '../rips/rips.module'
import { ProvisionService } from './provision.service'

@Module({
	imports: [EncryptionModule, PrismaModule, RipsModule],
	providers: [ProvisionService],
	exports: [ProvisionService],
})
export class ProvisionModule {}
