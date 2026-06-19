import { Injectable } from '@nestjs/common'
import { Config } from '../../../domain/entities/config'
import { AdminWalletNotFoundError } from '../../../domain/errors/admin-wallet-not-found.error'
import { PresetTierCountMismatchError } from '../../../domain/errors/preset-tier-count-mismatch.error'
import { Transaction } from '../../../domain/value-objects/transaction'
import { AdminWalletRepository } from '../../interfaces/repositories/admin-wallet.repository'
import { PresetRepository } from '../../interfaces/repositories/preset.repository'
import { RipsAdminService } from '../../interfaces/rips-admin.service'
import { UpdatePresetConfigUseCase } from './update-preset-config.use-case'

@Injectable()
export class UpdatePresetConfigService extends UpdatePresetConfigUseCase {
	constructor(
		private readonly ripsAdminService: RipsAdminService,
		private readonly adminWalletRepository: AdminWalletRepository,
		private readonly presetRepository: PresetRepository,
	) {
		super()
	}

	async execute(input: {
		presetId: number
		config: Omit<Config, 'id'>
	}): Promise<Transaction> {
		const [adminWallet, presetsWithRips] = await Promise.all([
			this.adminWalletRepository.get(),
			this.presetRepository.getPresetsWithOngoingRips(),
		])

		if (!adminWallet) {
			throw new AdminWalletNotFoundError('Admin wallet not provisioned')
		}

		const match = presetsWithRips.find(
			(s) => s.preset.id === input.presetId,
		)
		const currentTierCount =
			match?.preset.currentConfig?.payoutDistribution.length ?? null

		if (currentTierCount === null) {
			throw new AdminWalletNotFoundError(
				`Preset ${input.presetId} not found or has no active config`,
			)
		}

		if (input.config.payoutDistribution.length !== currentTierCount) {
			throw new PresetTierCountMismatchError(
				`Tier count mismatch: current ${currentTierCount}, provided ${input.config.payoutDistribution.length}`,
			)
		}

		return this.ripsAdminService.updatePreset(adminWallet, input)
	}
}
