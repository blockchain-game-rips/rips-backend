import { Module } from '@nestjs/common'
import { KmsModule } from '../kms/kms.module'
import { PrismaModule } from '../prisma/prisma.module'
import { RipsModule } from '../rips/rips.module'
import { ProvisionService } from './provision.service'

@Module({
	imports: [KmsModule, PrismaModule, RipsModule],
	providers: [ProvisionService],
	exports: [ProvisionService],
})
export class ProvisionModule {}
