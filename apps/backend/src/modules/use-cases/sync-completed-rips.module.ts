import { Module, Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EntryPayoutRepository } from '../../application/interfaces/repositories/entry-payout.repository'
import { PRESET_TO_TIER_BIASES } from '../../application/interfaces/tokens'
import { GetAvailablePresetsUseCase } from '../../application/use-cases/get-available-presets/get-available-presets.use-case'
import { SyncCompletedRipsService } from '../../application/use-cases/sync-completed-rips/sync-completed-rips.service'
import { SyncCompletedRipsUseCase } from '../../application/use-cases/sync-completed-rips/sync-completed-rips.use-case'
import { CARD_CONFIG_KEY, CardConfig } from '../../configuration/configuration'
import { isProd } from '../../constants'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { GetAvailablePresetsModule } from './get-available-presets.module'

async function assertConfig(
	getAvailablePresetsUseCase: GetAvailablePresetsUseCase,
	entryPayoutRepository: EntryPayoutRepository,
	cardConfig: {
		presetsBiases: Record<string, number[]>
	},
) {
	const availablePresets = await getAvailablePresetsUseCase.execute()

	const cardDefinitions = await entryPayoutRepository.getCardDefinitions()

	for (const preset of availablePresets) {
		const tierBiases = cardConfig.presetsBiases[preset.preset.id.toString()]

		if (tierBiases === undefined)
			throw new Error(
				`tier bieases are not found in config for preset id ${preset.preset.id}`,
			)

		if (tierBiases.length !== cardDefinitions.length)
			throw new Error(
				`tier biases count (${tierBiases.length}) mismatch with card definitions count (${cardDefinitions.length}) for preset id ${preset.preset.id}`,
			)
	}
}

const presetToTierBiasesProvider: Provider = {
	provide: PRESET_TO_TIER_BIASES,
	useFactory: async (
		configService: ConfigService,
		getAvailablePresetsUseCase: GetAvailablePresetsUseCase,
		entryPayoutRepository: EntryPayoutRepository,
	) => {
		const cardConfig = configService.getOrThrow<CardConfig>(CARD_CONFIG_KEY)

		if (isProd) {
			await assertConfig(
				getAvailablePresetsUseCase,
				entryPayoutRepository,
				cardConfig,
			)
		}

		return new Map(Object.entries(cardConfig.presetsBiases))
	},
	inject: [ConfigService, GetAvailablePresetsUseCase, EntryPayoutRepository],
}

@Module({
	imports: [IndexerModule, PrismaModule, GetAvailablePresetsModule],
	providers: [
		{
			provide: SyncCompletedRipsUseCase,
			useClass: SyncCompletedRipsService,
		},
		presetToTierBiasesProvider,
	],
	exports: [SyncCompletedRipsUseCase],
})
export class SyncCompletedRipsModule {}
