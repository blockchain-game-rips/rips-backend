import { Injectable, Logger } from '@nestjs/common'
import { z } from 'zod'
import { GetAvailablePresetsUseCase } from '../../application/use-cases/get-available-presets/get-available-presets.use-case'
import { PrismaService } from '../prisma/prisma.service'

const CardDefinitionInputSchema = z.object({
	presetId: z.number().int().positive(),
	tier: z.number().int().min(0),
	name: z.string().min(1),
	imageUrl: z.string().url(),
})

const CardDefinitionsConfigSchema = z.array(CardDefinitionInputSchema)

export type CardDefinitionsConfig = z.infer<typeof CardDefinitionsConfigSchema>

@Injectable()
export class SeedCardDefinitionsService {
	private readonly logger = new Logger(SeedCardDefinitionsService.name)

	constructor(
		private readonly getAvailablePresetsUseCase: GetAvailablePresetsUseCase,
		private readonly prisma: PrismaService,
	) {}

	parseConfig(raw: unknown): CardDefinitionsConfig {
		return CardDefinitionsConfigSchema.parse(raw)
	}

	async seed(config: CardDefinitionsConfig): Promise<void> {
		const presetTierCounts = await this.fetchPresetTierCounts()

		this.validateConfig(config, presetTierCounts)

		await this.upsertCards(config)

		this.logger.log(`Seeded ${config.length} card definitions.`)
	}

	private async fetchPresetTierCounts(): Promise<Map<number, number>> {
		const availablePresets = await this.getAvailablePresetsUseCase.execute()

		const presetTierCounts = new Map<number, number>()

		for (const { preset, fillingRip } of availablePresets) {
			const config =
				fillingRip === null ? preset.currentConfig : fillingRip.config

			presetTierCounts.set(preset.id, config.payoutDistribution.length)
		}

		return presetTierCounts
	}

	private validateConfig(
		config: CardDefinitionsConfig,
		presetTierCounts: Map<number, number>,
	): void {
		for (const card of config) {
			const tierCount = presetTierCounts.get(card.presetId)

			if (tierCount === undefined) {
				this.logger.error(
					`Preset ${card.presetId} not found on-chain. Aborting.`,
				)
				process.exit(1)
			}

			if (card.tier >= tierCount) {
				this.logger.error(
					`Tier ${card.tier} does not exist for preset ${card.presetId} (has ${tierCount} tiers). Aborting.`,
				)
				process.exit(1)
			}
		}
	}

	private async upsertCards(config: CardDefinitionsConfig): Promise<void> {
		for (const card of config) {
			await this.prisma.cardDefinition.upsert({
				where: {
					presetId_tier_name: {
						presetId: card.presetId,
						tier: card.tier,
						name: card.name,
					},
				},
				create: card,
				update: { imageUrl: card.imageUrl },
			})
		}
	}
}
