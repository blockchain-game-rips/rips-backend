import { Module } from '@nestjs/common'
import { CheckExecutorHealthService } from '../../application/use-cases/check-executor-health/check-executor-health.service'
import { CheckExecutorHealthUseCase } from '../../application/use-cases/check-executor-health/check-executor-health.use-case'
import { MetricsModule } from '../../infrastructure/metrics/metrics.module'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { RipsModule } from '../../infrastructure/rips/rips.module'

@Module({
	imports: [PrismaModule, RipsModule, MetricsModule],
	providers: [
		{
			provide: CheckExecutorHealthUseCase,
			useClass: CheckExecutorHealthService,
		},
	],
	exports: [CheckExecutorHealthUseCase],
})
export class CheckExecutorHealthUseCaseModule {}
