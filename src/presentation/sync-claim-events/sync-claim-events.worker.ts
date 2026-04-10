import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SyncClaimEventsUseCase } from 'src/application/use-cases/sync-claim-events/sync-claim-events.use-case'

@Injectable()
export class SyncClaimEventsWorker {
	constructor(
		private readonly syncClaimEventsUseCase: SyncClaimEventsUseCase,
	) {}

	@Cron(CronExpression.EVERY_5_SECONDS, { waitForCompletion: true })
	async run() {
		await this.syncClaimEventsUseCase.execute()
	}
}
