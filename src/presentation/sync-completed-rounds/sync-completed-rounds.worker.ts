import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SyncCompletedRoundsUseCase } from '../../application/use-cases/sync-completed-rounds/sync-completed-rounds.use-case'
import { WorkerMetricsService } from '../../infrastructure/metrics/worker-metrics.service'

const WORKER_NAME = 'sync-completed-rounds'

@Injectable()
export class SyncCompletedRoundsWorker {
	private readonly logger = new Logger(SyncCompletedRoundsWorker.name)

	constructor(
		private readonly syncCompletedRoundsUseCase: SyncCompletedRoundsUseCase,
		private readonly workerMetrics: WorkerMetricsService,
	) {}

	@Cron(CronExpression.EVERY_5_SECONDS, { waitForCompletion: true })
	async run() {
		const endRun = this.workerMetrics.startRun(WORKER_NAME)

		try {
			await this.syncCompletedRoundsUseCase.execute()
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
