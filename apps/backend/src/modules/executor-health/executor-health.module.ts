import { Module } from '@nestjs/common'
import { MetricsModule } from '../../infrastructure/metrics/metrics.module'
import { ExecutorHealthWorker } from '../../presentation/executor-health/executor-health.worker'
import { CheckExecutorHealthUseCaseModule } from '../use-cases/check-executor-health.module'

@Module({
	imports: [CheckExecutorHealthUseCaseModule, MetricsModule],
	providers: [ExecutorHealthWorker],
})
export class ExecutorHealthModule {}
