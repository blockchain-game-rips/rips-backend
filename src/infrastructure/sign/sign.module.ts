import { Module } from '@nestjs/common'
import { KmsModule } from 'src/infrastructure/kms/kms.module'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { SignService } from './sign.service'

@Module({
	imports: [KmsModule, PrismaModule],
	providers: [SignService],
	exports: [SignService],
})
export class SignModule {}
