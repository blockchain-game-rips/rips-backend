import { Module, Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TicketPrizeRepository } from 'src/application/interfaces/repositories/ticket-prize.repository'
import { STAKE_TO_TIER_BIASES } from 'src/application/interfaces/tokens'
import { GetAvailableStakesUseCase } from 'src/application/use-cases/get-available-stakes/get-available-stakes.use-case'
import { SyncClaimEventsService } from 'src/application/use-cases/sync-claim-events/sync-claim-events.service'
import { SyncClaimEventsUseCase } from 'src/application/use-cases/sync-claim-events/sync-claim-events.use-case'
import { CARD_CONFIG_KEY, CardConfig } from 'src/configuration/configuration'
import { IndexerModule } from 'src/infrastructure/indexer/indexer.module'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { GetAvailableStakesModule } from './get-available-stakes.module'

const stakeToTierBiasesProvider: Provider = {
	provide: STAKE_TO_TIER_BIASES,
	useFactory: async (
		configService: ConfigService,
		getAvailableStakesUseCase: GetAvailableStakesUseCase,
		ticketPrizeRepository: TicketPrizeRepository,
	) => {
		const cardConfig = configService.getOrThrow<CardConfig>(CARD_CONFIG_KEY)
		const availableStakes = await getAvailableStakesUseCase.execute()

		await Promise.all(
			availableStakes.map(async (stake) => {
				const tierBiases =
					cardConfig.stakesBiases[stake.stake.id.toString()]

				if (tierBiases === undefined)
					throw new Error(
						`tier bieases are not found in config for stake id ${stake.stake.id}`,
					)

				const cardDefinitions =
					await ticketPrizeRepository.getCardDefinitionsByStake(
						stake.stake.id,
					)

				if (tierBiases.length !== cardDefinitions.length)
					throw new Error(
						`tier biases count (${tierBiases.length}) mismatch with card definitions count (${cardDefinitions.length}) for stake id ${stake.stake.id}`,
					)
			}),
		)

		return new Map(Object.entries(cardConfig.stakesBiases))
	},
	inject: [ConfigService, GetAvailableStakesUseCase, TicketPrizeRepository],
}

@Module({
	imports: [IndexerModule, PrismaModule, GetAvailableStakesModule],
	providers: [
		{ provide: SyncClaimEventsUseCase, useClass: SyncClaimEventsService },
		stakeToTierBiasesProvider,
	],
	exports: [SyncClaimEventsUseCase],
})
export class SyncClaimEventsModule {}
