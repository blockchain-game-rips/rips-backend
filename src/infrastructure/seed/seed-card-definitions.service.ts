import { Injectable, Logger } from '@nestjs/common'
import { GetAvailableStakesUseCase } from 'src/application/use-cases/get-available-stakes/get-available-stakes.use-case'
import { PrismaService } from 'src/infrastructure/prisma/prisma.service'
import { z } from 'zod'

const CardDefinitionInputSchema = z.object({
	stakeId: z.number().int().positive(),
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
		private readonly getAvailableStakesUseCase: GetAvailableStakesUseCase,
		private readonly prisma: PrismaService,
	) {}

	parseConfig(raw: unknown): CardDefinitionsConfig {
		return CardDefinitionsConfigSchema.parse(raw)
	}

	async seed(config: CardDefinitionsConfig): Promise<void> {
		const stakeTierCounts = await this.fetchStakeTierCounts()

		this.validateConfig(config, stakeTierCounts)

		await this.upsertCards(config)

		this.logger.log(`Seeded ${config.length} card definitions.`)
	}

	private async fetchStakeTierCounts(): Promise<Map<number, number>> {
		const availableStakes = await this.getAvailableStakesUseCase.execute()

		const stakeTierCounts = new Map<number, number>()

		for (const { stake, fillingRound } of availableStakes) {
			const config =
				fillingRound === null
					? stake.currentConfig
					: fillingRound.config

			stakeTierCounts.set(stake.id, config.prizeDistribution.length)
		}

		return stakeTierCounts
	}

	private validateConfig(
		config: CardDefinitionsConfig,
		stakeTierCounts: Map<number, number>,
	): void {
		for (const card of config) {
			const tierCount = stakeTierCounts.get(card.stakeId)

			if (tierCount === undefined) {
				this.logger.error(
					`Stake ${card.stakeId} not found on-chain. Aborting.`,
				)
				process.exit(1)
			}

			if (card.tier >= tierCount) {
				this.logger.error(
					`Tier ${card.tier} does not exist for stake ${card.stakeId} (has ${tierCount} tiers). Aborting.`,
				)
				process.exit(1)
			}
		}
	}

	private async upsertCards(config: CardDefinitionsConfig): Promise<void> {
		for (const card of config) {
			await this.prisma.cardDefinition.upsert({
				where: {
					stakeId_tier_name: {
						stakeId: card.stakeId,
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
