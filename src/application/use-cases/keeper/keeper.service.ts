import { Injectable } from '@nestjs/common'
import { ExecutorRepository } from 'src/application/interfaces/repositories/executor.repository'
import { RipsService } from 'src/application/interfaces/rips.service'
import { Executor } from 'src/domain/entities/executor'
import { OngoingRound, Round, RoundStatus } from 'src/domain/entities/round'
import { GetOngoingRoundsUseCase } from '../get-ongoing-rounds/get-ongoing-rounds.use-case'
import { HandleClaimUseCase } from '../handle-claim/handle-claim.use-case'
import { KeeperUseCase } from './keeper.use-case'

type KeeperAction =
	| { type: 'requestVrf'; round: Round }
	| { type: 'claim'; round: Round }
	| { type: 'refund'; round: Round }

@Injectable()
export class KeeperService extends KeeperUseCase {
	constructor(
		private readonly getOngoingRoundsUseCase: GetOngoingRoundsUseCase,
		private readonly executorRepository: ExecutorRepository,
		private readonly ripsService: RipsService,
		private readonly handleClaimUseCase: HandleClaimUseCase,
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
				case RoundStatus.CLAIMING:
					return [{ type: 'claim', round }]
				case RoundStatus.REFUNDING:
					return [{ type: 'refund', round }]
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

			case 'claim':
				await this.handleClaimUseCase.execute({
					round: action.round,
					executor,
				})
				break

			case 'refund':
				await this.handleRefund(executor, action.round)
				break
		}
	}

	private async handleRefund(
		executor: Executor,
		round: Round,
	): Promise<void> {
		const claimedAddresses = new Set(
			round.actions.refunds.map((r) => r.userAddress),
		)

		for (const purchase of round.actions.purchases) {
			if (claimedAddresses.has(purchase.userAddress)) continue

			await this.ripsService.refund(executor.wallet, {
				roundId: round.id,
				userAddress: purchase.userAddress,
			})
		}
	}
}
