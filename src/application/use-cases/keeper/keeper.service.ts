import { Injectable } from '@nestjs/common'
import { Round, RoundStatus } from 'src/domain/entities/round'
import { RipsKeeperService } from 'src/infrastructure/rips/rips-keeper.service'
import { Address } from 'viem'
import { GetRoundsUseCase } from '../get-rounds/get-rounds.use-case'
import { HandleClaimUseCase } from '../handle-claim/handle-claim.use-case'
import { KeeperUseCase } from './keeper.use-case'

@Injectable()
export class KeeperService extends KeeperUseCase {
	constructor(
		private readonly getRoundsUseCase: GetRoundsUseCase,
		private readonly ripsKeeperService: RipsKeeperService,
		private readonly handleClaimUseCase: HandleClaimUseCase,
	) {
		super()
	}

	async execute(): Promise<void> {
		const rounds = await this.getRoundsUseCase.execute()

		for (const round of rounds) {
			switch (round.status) {
				case RoundStatus.SEALED: {
					await this.handleSealed(round)
					break
				}
				case RoundStatus.CLAIMING: {
					await this.handleClaiming(round)
					break
				}
				case RoundStatus.REFUNDING: {
					await this.handleRefund(round)
					break
				}

				case RoundStatus.VRFREQUESTED:
				case RoundStatus.FILLING:
				case RoundStatus.CLAIMED:
				case RoundStatus.REFUNDED:
			}
		}
	}

	private async handleSealed(round: Round) {
		try {
			await this.ripsKeeperService.requestVrf(round.id)
		} catch (error) {
			console.log(error)
		}
	}

	private async handleClaiming(round: Round) {
		try {
			await this.handleClaimUseCase.execute({ round })
		} catch (error) {
			console.log(error)
		}
	}

	private async handleRefund(round: Round) {
		try {
			const actions = round.actions

			const uniqueRefundedAddresses: Set<Address> = new Set()

			for (const refund of actions.refunds) {
				uniqueRefundedAddresses.add(refund.userAddress)
			}

			for (const purchase of actions.purchases) {
				if (uniqueRefundedAddresses.has(purchase.userAddress)) continue

				try {
					await this.ripsKeeperService.refund(
						round.id,
						purchase.userAddress,
					)
				} catch (error) {
					console.log(error)
				}
			}
		} catch (error) {
			console.log(error)
		}
	}
}
