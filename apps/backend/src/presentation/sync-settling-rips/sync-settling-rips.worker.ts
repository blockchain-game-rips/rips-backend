import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SyncSettlingRipsUseCase } from '../../application/use-cases/sync-settling-rips/sync-settling-rips.use-case'
import { WorkerMetricsService } from '../../infrastructure/metrics/worker-metrics.service'

const WORKER_NAME = 'sync-settling-rips'

@Injectable()
export class SyncSettlingRipsWorker {
	private readonly logger = new Logger(SyncSettlingRipsWorker.name)

	constructor(
		private readonly syncSettlingRipsUseCase: SyncSettlingRipsUseCase,
		private readonly workerMetrics: WorkerMetricsService,
	) {}

	@Cron(CronExpression.EVERY_5_SECONDS, { waitForCompletion: true })
	async run() {
		const endRun = this.workerMetrics.startRun(WORKER_NAME)

		try {
			await this.syncSettlingRipsUseCase.execute()
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
