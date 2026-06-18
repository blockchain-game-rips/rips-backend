import { Module } from '@nestjs/common'
import { KmsModule } from '../kms/kms.module'
import { PrismaModule } from '../prisma/prisma.module'
import { ProvisionService } from './provision.service'

@Module({
	imports: [KmsModule, PrismaModule],
	providers: [ProvisionService],
	exports: [ProvisionService],
})
export class ProvisionModule {}
