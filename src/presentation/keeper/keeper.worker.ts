import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { KeeperUseCase } from '../../application/use-cases/keeper/keeper.use-case'

@Injectable()
export class KeeperWorker {
	constructor(private readonly keeperUseCase: KeeperUseCase) {}

	@Cron(CronExpression.EVERY_5_SECONDS, { waitForCompletion: true })
	async run() {
		await this.keeperUseCase.execute()
	}
}
