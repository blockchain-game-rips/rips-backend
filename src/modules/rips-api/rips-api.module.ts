import { Module } from '@nestjs/common'
import { RipsController } from '../../presentation/rips/rips.controller'
import { BuyTicketsModule } from '../use-cases/buy-tickets.module'
import { GetAvailableStakesModule } from '../use-cases/get-available-stakes.module'
import { GetCardCollectionModule } from '../use-cases/get-card-collection.module'
import { GetCardDefinitionsModule } from '../use-cases/get-card-definitions.module'
import { GetCompletedRoundsModule } from '../use-cases/get-completed-rounds.module'
import { GetOngoingRoundsModule } from '../use-cases/get-ongoing-rounds.module'
import { GetPriceModule } from '../use-cases/get-price.module'
import { GetRoundsModule } from '../use-cases/get-rounds.module'
import { GetUnrevealedPrizesModule } from '../use-cases/get-unrevealed-prizes.module'
import { GetZapResultModule } from '../use-cases/get-zap-result.module'
import { QuotePurchaseModule } from '../use-cases/quote-purchase.module'
import { QuoteZapModule } from '../use-cases/quote-zap.module'
import { RevealTicketPrizesModule } from '../use-cases/reveal-ticket-prizes.module'

@Module({
	imports: [
		GetRoundsModule,
		GetAvailableStakesModule,
		GetOngoingRoundsModule,
		GetCompletedRoundsModule,
		BuyTicketsModule,
		GetPriceModule,
		GetUnrevealedPrizesModule,
		RevealTicketPrizesModule,
		QuotePurchaseModule,
		QuoteZapModule,
		GetZapResultModule,
		GetCardCollectionModule,
		GetCardDefinitionsModule,
	],
	controllers: [RipsController],
})
export class RipsApiModule {}
