import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { KeeperUseCase } from '../../application/use-cases/keeper/keeper.use-case'
import { WorkerMetricsService } from '../../infrastructure/metrics/worker-metrics.service'

const WORKER_NAME = 'keeper'

@Injectable()
export class KeeperWorker {
	private readonly logger = new Logger(KeeperWorker.name)

	constructor(
		private readonly keeperUseCase: KeeperUseCase,
		private readonly workerMetrics: WorkerMetricsService,
	) {}

	@Cron(CronExpression.EVERY_5_SECONDS, { waitForCompletion: true })
	async run() {
		const endRun = this.workerMetrics.startRun(WORKER_NAME)

		try {
			await this.keeperUseCase.execute()
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
