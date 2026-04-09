import { Module } from '@nestjs/common'
import { KmsModule } from 'src/infrastructure/kms/kms.module'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { ProvisionService } from './provision.service'

@Module({
	imports: [KmsModule, PrismaModule],
	providers: [ProvisionService],
	exports: [ProvisionService],
})
export class ProvisionModule {}
