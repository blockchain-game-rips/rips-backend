import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { CheckExecutorHealthUseCase } from '../../application/use-cases/check-executor-health/check-executor-health.use-case'
import { WorkerMetricsService } from '../../infrastructure/metrics/worker-metrics.service'

const WORKER_NAME = 'executor-health'

@Injectable()
export class ExecutorHealthWorker {
	private readonly logger = new Logger(ExecutorHealthWorker.name)

	constructor(
		private readonly checkExecutorHealthUseCase: CheckExecutorHealthUseCase,
		private readonly workerMetrics: WorkerMetricsService,
	) {}

	@Cron(CronExpression.EVERY_30_SECONDS, { waitForCompletion: true })
	async run() {
		const endRun = this.workerMetrics.startRun(WORKER_NAME)

		try {
			await this.checkExecutorHealthUseCase.execute()
			endRun('success')
		} catch (error) {
			endRun('failure')
			this.logger.error(
				{ worker: WORKER_NAME, err: error },
				'Worker run failed',
			)
		}
	}
}
