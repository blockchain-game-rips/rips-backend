import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SyncCompletedRoundsUseCase } from '../../application/use-cases/sync-completed-rounds/sync-completed-rounds.use-case'

@Injectable()
export class SyncCompletedRoundsWorker {
	constructor(
		private readonly syncCompletedRoundsUseCase: SyncCompletedRoundsUseCase,
	) {}

	@Cron(CronExpression.EVERY_5_SECONDS, { waitForCompletion: true })
	async run() {
		await this.syncCompletedRoundsUseCase.execute()
	}
}
