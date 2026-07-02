import { Injectable, Logger } from '@nestjs/common'
import { z } from 'zod'
import { GetAvailablePresetsUseCase } from '../../application/use-cases/get-available-presets/get-available-presets.use-case'
import { PrismaService } from '../prisma/prisma.service'

const CardDefinitionInputSchema = z.object({
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
		await this.validateTierCounts(config)

		await this.upsertCards(config)

		this.logger.log(`Seeded ${config.length} card definitions.`)
	}

	private async validateTierCounts(
		config: CardDefinitionsConfig,
	): Promise<void> {
		const cardTierCount = new Set(config.map((card) => card.tier)).size

		const availablePresets = await this.getAvailablePresetsUseCase.execute()

		for (const { preset, fillingRip } of availablePresets) {
			const presetConfig =
				fillingRip === null ? preset.currentConfig : fillingRip.config

			const presetTierCount = presetConfig.payoutDistribution.length

			if (presetTierCount !== cardTierCount) {
				this.logger.error(
					`Preset ${preset.id} has ${presetTierCount} tiers but cards define ${cardTierCount} tiers. Aborting.`,
				)
				process.exit(1)
			}
		}
	}

	private async upsertCards(config: CardDefinitionsConfig): Promise<void> {
		for (const card of config) {
			await this.prisma.cardDefinition.upsert({
				where: {
					tier_name: {
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
