import { Module } from '@nestjs/common'
import { RecordEligibilityService } from '../../application/use-cases/record-eligibility/record-eligibility.service'
import { RecordEligibilityUseCase } from '../../application/use-cases/record-eligibility/record-eligibility.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
	imports: [PrismaModule],
	providers: [
		{
			provide: RecordEligibilityUseCase,
			useClass: RecordEligibilityService,
		},
	],
	exports: [RecordEligibilityUseCase],
})
export class RecordEligibilityModule {}
