import { Module, Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TicketPrizeRepository } from '../../application/interfaces/repositories/ticket-prize.repository'
import { STAKE_TO_TIER_BIASES } from '../../application/interfaces/tokens'
import { GetAvailableStakesUseCase } from '../../application/use-cases/get-available-stakes/get-available-stakes.use-case'
import { SyncCompletedRoundsService } from '../../application/use-cases/sync-completed-rounds/sync-completed-rounds.service'
import { SyncCompletedRoundsUseCase } from '../../application/use-cases/sync-completed-rounds/sync-completed-rounds.use-case'
import { CARD_CONFIG_KEY, CardConfig } from '../../configuration/configuration'
import { isProd } from '../../constants'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { GetAvailableStakesModule } from './get-available-stakes.module'

async function assertConfig(
	getAvailableStakesUseCase: GetAvailableStakesUseCase,
	ticketPrizeRepository: TicketPrizeRepository,
	cardConfig: {
		stakesBiases: Record<string, number[]>
	},
) {
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
}

const stakeToTierBiasesProvider: Provider = {
	provide: STAKE_TO_TIER_BIASES,
	useFactory: async (
		configService: ConfigService,
		getAvailableStakesUseCase: GetAvailableStakesUseCase,
		ticketPrizeRepository: TicketPrizeRepository,
	) => {
		const cardConfig = configService.getOrThrow<CardConfig>(CARD_CONFIG_KEY)

		if (isProd) {
			await assertConfig(
				getAvailableStakesUseCase,
				ticketPrizeRepository,
				cardConfig,
			)
		}

		return new Map(Object.entries(cardConfig.stakesBiases))
	},
	inject: [ConfigService, GetAvailableStakesUseCase, TicketPrizeRepository],
}

@Module({
	imports: [IndexerModule, PrismaModule, GetAvailableStakesModule],
	providers: [
		{
			provide: SyncCompletedRoundsUseCase,
			useClass: SyncCompletedRoundsService,
		},
		stakeToTierBiasesProvider,
	],
	exports: [SyncCompletedRoundsUseCase],
})
export class SyncCompletedRoundsModule {}
