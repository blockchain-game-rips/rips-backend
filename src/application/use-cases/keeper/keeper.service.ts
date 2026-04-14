import { Injectable } from '@nestjs/common'
import { Executor } from '../../../domain/entities/executor'
import {
	OngoingRound,
	Round,
	RoundStatus,
} from '../../../domain/entities/round'
import { ExecutorRepository } from '../../interfaces/repositories/executor.repository'
import { UserRepository } from '../../interfaces/repositories/user.repository'
import { RipsService } from '../../interfaces/rips.service'
import { GetOngoingRoundsUseCase } from '../get-ongoing-rounds/get-ongoing-rounds.use-case'
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

	// TODO: I don't understand, will 3 executors run 3 claims in parallel
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
				await this.handleClaim(executor, action.round)
				break

			case 'refund':
				await this.handleRefund(executor, action.round)
				break
		}
	}

	private async handleClaim(executor: Executor, round: Round): Promise<void> {
		const uniqueClaimedAddresses = new Set(
			round.actions.claims.map((c) => c.userAddress),
		)

		for (const purchase of round.actions.purchases) {
			if (uniqueClaimedAddresses.has(purchase.userAddress)) continue

			const user = await this.userRepository.findByEvmAddress(
				purchase.userAddress,
			)

			await this.ripsService.claim(executor.wallet, {
				roundId: round.id,
				userAddress: purchase.userAddress,
				referrerAddress: user?.referrerAddress ?? null,
			})
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
