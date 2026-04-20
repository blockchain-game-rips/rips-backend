import { Injectable } from '@nestjs/common'
import { Executor } from '../../../domain/entities/executor'
import {
	OngoingRound,
	Round,
	RoundStatus,
} from '../../../domain/entities/round'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { ExecutorRepository } from '../../interfaces/repositories/executor.repository'
import { UserRepository } from '../../interfaces/repositories/user.repository'
import { RipsService } from '../../interfaces/rips.service'
import { GetOngoingRoundsUseCase } from '../get-ongoing-rounds/get-ongoing-rounds.use-case'
import { KeeperUseCase } from './keeper.use-case'

type KeeperAction =
	| { type: 'requestVrf'; round: Round }
	| { type: 'claim'; round: Round; userAddress: EvmAddress }
	| { type: 'refund'; round: Round; userAddress: EvmAddress }

@Injectable()
export class KeeperService extends KeeperUseCase {
	constructor(
		private readonly getOngoingRoundsUseCase: GetOngoingRoundsUseCase,
		private readonly executorRepository: ExecutorRepository,
		private readonly userRepository: UserRepository,
		private readonly ripsService: RipsService,
	) {
		super()
	}

	async execute(): Promise<void> {
		const [rounds, executors] = await Promise.all([
			this.getOngoingRoundsUseCase.execute(),
			this.executorRepository.getAll(),
		])

		if (executors.length === 0) return

		const actions = this.collectActions(rounds)

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

	private collectActions(rounds: OngoingRound[]): KeeperAction[] {
		return rounds.flatMap((round): KeeperAction[] => {
			switch (round.status) {
				case RoundStatus.SEALED:
					return [{ type: 'requestVrf', round }]

				case RoundStatus.CLAIMING: {
					const claimedAddresses = new Set(
						round.actions.claims.map((c) => c.userAddress),
					)

					return round.actions.purchases
						.filter((p) => !claimedAddresses.has(p.userAddress))
						.map((p) => ({
							type: 'claim',
							round,
							userAddress: p.userAddress,
						}))
				}

				case RoundStatus.REFUNDING: {
					const refundedAddresses = new Set(
						round.actions.refunds.map((r) => r.userAddress),
					)

					return round.actions.purchases
						.filter((p) => !refundedAddresses.has(p.userAddress))
						.map((p) => ({
							type: 'refund',
							round,
							userAddress: p.userAddress,
						}))
				}

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
				console.log(error)
			}
		}
	}

	private async executeAction(
		executor: Executor,
		action: KeeperAction,
	): Promise<void> {
		switch (action.type) {
			case 'requestVrf':
				await this.ripsService.requestVrf(executor.wallet, {
					roundId: action.round.id,
				})
				break

			case 'claim': {
				const user = await this.userRepository.findByEvmAddress(
					action.userAddress,
				)

				await this.ripsService.claim(executor.wallet, {
					roundId: action.round.id,
					userAddress: action.userAddress,
					referrerAddress: user?.referrerAddress ?? null,
				})
				break
			}

			case 'refund':
				await this.ripsService.refund(executor.wallet, {
					roundId: action.round.id,
					userAddress: action.userAddress,
				})
				break
		}
	}
}
