import { Injectable } from '@nestjs/common'
import { Config } from '../../../domain/entities/config'
import { AdminWalletNotFoundError } from '../../../domain/errors/admin-wallet-not-found.error'
import { StakeTierCountMismatchError } from '../../../domain/errors/stake-tier-count-mismatch.error'
import { Transaction } from '../../../domain/value-objects/transaction'
import { AdminWalletRepository } from '../../interfaces/repositories/admin-wallet.repository'
import { StakeRepository } from '../../interfaces/repositories/stake.repository'
import { RipsAdminService } from '../../interfaces/rips-admin.service'
import { UpdateStakeConfigUseCase } from './update-stake-config.use-case'

@Injectable()
export class UpdateStakeConfigService extends UpdateStakeConfigUseCase {
	constructor(
		private readonly ripsAdminService: RipsAdminService,
		private readonly adminWalletRepository: AdminWalletRepository,
		private readonly stakeRepository: StakeRepository,
	) {
		super()
	}

	async execute(input: {
		stakeId: number
		config: Omit<Config, 'id'>
	}): Promise<Transaction> {
		const [adminWallet, stakesWithRounds] = await Promise.all([
			this.adminWalletRepository.get(),
			this.stakeRepository.getStakesWithOngoingRounds(),
		])

		if (!adminWallet) {
			throw new AdminWalletNotFoundError('Admin wallet not provisioned')
		}

		const match = stakesWithRounds.find((s) => s.stake.id === input.stakeId)
		const currentTierCount =
			match?.stake.currentConfig?.prizeDistribution.length ?? null

		if (currentTierCount === null) {
			throw new AdminWalletNotFoundError(
				`Stake ${input.stakeId} not found or has no active config`,
			)
		}

		if (input.config.prizeDistribution.length !== currentTierCount) {
			throw new StakeTierCountMismatchError(
				`Tier count mismatch: current ${currentTierCount}, provided ${input.config.prizeDistribution.length}`,
			)
		}

		return this.ripsAdminService.updateStake(adminWallet, input)
	}
}
