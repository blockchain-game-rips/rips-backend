import { Injectable, Logger } from '@nestjs/common'
import { Executor } from '../../../domain/entities/executor'
import { OngoingRip, Rip, RipStatus } from '../../../domain/entities/rip'
import { resolveUnclaimedAddresses } from '../../../domain/services/claim-utils'
import { evmAddressFromWallet } from '../../../domain/services/evm'
import { resolveUnrefundedAddresses } from '../../../domain/services/refund-utils'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import {
	attemptTransactionId,
	TransactionAttempt,
} from '../../../domain/value-objects/transaction-attempt'
import {
	KeeperActionName,
	KeeperMetricsService,
} from '../../../infrastructure/metrics/keeper-metrics.service'
import { ExecutorRepository } from '../../interfaces/repositories/executor.repository'
import { UserRepository } from '../../interfaces/repositories/user.repository'
import { RipsService } from '../../interfaces/rips.service'
import { GetOngoingRipsUseCase } from '../get-ongoing-rips/get-ongoing-rips.use-case'
import { KeeperUseCase } from './keeper.use-case'

type KeeperAction =
	| { type: 'requestVrf'; rip: Rip }
	| { type: 'claim'; rip: Rip; userAddress: EvmAddress }
	| { type: 'refund'; rip: Rip; userAddress: EvmAddress }

@Injectable()
export class KeeperService extends KeeperUseCase {
	private readonly logger = new Logger(KeeperService.name)

	constructor(
		private readonly getOngoingRipsUseCase: GetOngoingRipsUseCase,
		private readonly executorRepository: ExecutorRepository,
		private readonly userRepository: UserRepository,
		private readonly ripsService: RipsService,
		private readonly keeperMetrics: KeeperMetricsService,
	) {
		super()
	}

	async execute(): Promise<void> {
		const [rips, executors] = await Promise.all([
			this.getOngoingRipsUseCase.execute(),
			this.executorRepository.getAll(),
		])

		if (executors.length === 0) return

		const actions = this.collectActions(rips)

		const actionsByExecutor = this.groupByExecutor(
			actions,
			executors.length,
		)

		await Promise.all(
			executors.map((executor, i) =>
				this.executeSequentially(executor, actionsByExecutor[i]),
			),
		)
	}

	private groupByExecutor(
		actions: KeeperAction[],
		executorCount: number,
	): KeeperAction[][] {
		const groups: KeeperAction[][] = Array.from(
			{ length: executorCount },
			() => [],
		)

		actions.forEach((action, i) => groups[i % executorCount].push(action))

		return groups
	}

	private collectActions(rips: OngoingRip[]): KeeperAction[] {
		return rips.flatMap((rip): KeeperAction[] => {
			switch (rip.status) {
				case RipStatus.SEALED:
					return [{ type: 'requestVrf', rip }]

				case RipStatus.CLAIMING:
					return resolveUnclaimedAddresses(rip.actions).map(
						(userAddress) => ({
							type: 'claim',
							rip,
							userAddress,
						}),
					)

				case RipStatus.REFUNDING:
					return resolveUnrefundedAddresses(rip.actions).map(
						(userAddress) => ({
							type: 'refund',
							rip,
							userAddress,
						}),
					)

				default:
					return []
			}
		})
	}

	private async executeSequentially(
		executor: Executor,
		actions: KeeperAction[],
	): Promise<void> {
		for (const action of actions) {
			try {
				await this.executeAction(executor, action)
			} catch (error) {
				this.logger.warn(
					{
						actionType: action.type,
						ripId: action.rip.id,
						userAddress:
							'userAddress' in action
								? action.userAddress
								: undefined,
						error,
					},
					'Keeper action threw',
				)
			}
		}
	}

	private async executeAction(
		executor: Executor,
		action: KeeperAction,
	): Promise<void> {
		switch (action.type) {
			case 'requestVrf': {
				const attempt = await this.ripsService.requestVrf(
					executor.wallet,
					{ ripId: action.rip.id },
				)

				this.recordAttempt(executor, 'request-vrf', attempt, {
					ripId: action.rip.id,
				})
				break
			}

			case 'claim': {
				const user = await this.userRepository.findByEvmAddress(
					action.userAddress,
				)

				const attempt = await this.ripsService.claim(executor.wallet, {
					ripId: action.rip.id,
					userAddress: action.userAddress,
					referrerAddress: user?.referrerAddress ?? null,
				})

				this.recordAttempt(executor, 'claim', attempt, {
					userId: user?.id.toString(),
					ripId: action.rip.id,
					userAddress: action.userAddress,
				})
				break
			}

			case 'refund': {
				const attempt = await this.ripsService.refund(executor.wallet, {
					ripId: action.rip.id,
					userAddress: action.userAddress,
				})

				this.recordAttempt(executor, 'refund', attempt, {
					ripId: action.rip.id,
					userAddress: action.userAddress,
				})
				break
			}
		}
	}

	/**
	 * The transport layer returns send failures as a value, so this is the one
	 * place where a keeper action's outcome is known.
	 */
	private recordAttempt(
		executor: Executor,
		action: KeeperActionName,
		attempt: TransactionAttempt,
		context: Record<string, unknown>,
	): void {
		this.keeperMetrics.countAction(
			evmAddressFromWallet(executor.wallet),
			action,
			attempt,
		)

		if (attempt.status === 'succeeded') return

		this.logger.error(
			{
				...context,
				action,
				status: attempt.status,
				txHash: attemptTransactionId(attempt),
			},
			'Keeper action did not succeed',
		)
	}
}
