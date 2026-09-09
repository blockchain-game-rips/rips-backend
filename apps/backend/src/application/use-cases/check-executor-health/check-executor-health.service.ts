import { Injectable } from '@nestjs/common'
import { evmAddressFromWallet } from '../../../domain/services/evm'
import { KeeperMetricsService } from '../../../infrastructure/metrics/keeper-metrics.service'
import { ExecutorHealthService } from '../../interfaces/executor-health.service'
import { ExecutorRepository } from '../../interfaces/repositories/executor.repository'
import { CheckExecutorHealthUseCase } from './check-executor-health.use-case'

@Injectable()
export class CheckExecutorHealthService extends CheckExecutorHealthUseCase {
	constructor(
		private readonly executorRepository: ExecutorRepository,
		private readonly executorHealthService: ExecutorHealthService,
		private readonly keeperMetrics: KeeperMetricsService,
	) {
		super()
	}

	async execute(): Promise<void> {
		const executors = await this.executorRepository.getAll()

		await Promise.all(
			executors.map(async (executor) => {
				const address = evmAddressFromWallet(executor.wallet)
				const health = await this.executorHealthService.read(address)

				this.keeperMetrics.recordHealth(address, health)
			}),
		)
	}
}
