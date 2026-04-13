import { ConfigService } from '@nestjs/config'
import { TicketPrizeRepository } from 'src/application/interfaces/repositories/ticket-prize.repository'
import { STAKE_TO_TIER_BIASES } from 'src/application/interfaces/tokens'
import { CARD_CONFIG_KEY, CardConfig } from 'src/configuration/configuration'

export const stakeToTierBiasesProvider = {
	provide: STAKE_TO_TIER_BIASES,
	useFactory: async (
		configService: ConfigService,
		ticketPrizeRepository: TicketPrizeRepository,
	): Promise<Map<number, number[]>> => {
		const cardConfig = configService.getOrThrow<CardConfig>(CARD_CONFIG_KEY)

		const result = new Map<number, number[]>()

		for (const [stakeIdStr, biases] of Object.entries(
			cardConfig.stakesBiases,
		)) {
			const stakeId = Number(stakeIdStr)

			const cardsByTier =
				await ticketPrizeRepository.getCardDefinitionsByStake(stakeId)

			if (cardsByTier.length !== biases.length) {
				throw new Error(
					`Stake ${stakeId}: config has ${biases.length} tier biases but DB has ${cardsByTier.length} tiers`,
				)
			}

			result.set(stakeId, biases)
		}

		return result
	},
	inject: [ConfigService, TicketPrizeRepository],
}
