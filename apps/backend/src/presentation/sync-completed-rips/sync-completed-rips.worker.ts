import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SyncCompletedRipsUseCase } from '../../application/use-cases/sync-completed-rips/sync-completed-rips.use-case'
import { WorkerMetricsService } from '../../infrastructure/metrics/worker-metrics.service'

const WORKER_NAME = 'sync-completed-rips'

@Injectable()
export class SyncCompletedRipsWorker {
	private readonly logger = new Logger(SyncCompletedRipsWorker.name)

	constructor(
		private readonly syncCompletedRipsUseCase: SyncCompletedRipsUseCase,
		private readonly workerMetrics: WorkerMetricsService,
	) {}

	@Cron(CronExpression.EVERY_5_SECONDS, { waitForCompletion: true })
	async run() {
		const endRun = this.workerMetrics.startRun(WORKER_NAME)

		try {
			await this.syncCompletedRipsUseCase.execute()
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
