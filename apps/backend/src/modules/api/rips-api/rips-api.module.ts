import { Module } from '@nestjs/common'
import { KNOWN_TOKENS } from '../../../infrastructure/evm/primitives/currencies/constants'
import { PriceOracleModule } from '../../../infrastructure/price-provider/price-provider.module'
import { RipsController } from '../../../presentation/rips/rips.controller'
import { BuyTicketsPurchaseModule } from '../../use-cases/buy-tickets-purchase.module'
import { BuyTicketsZapModule } from '../../use-cases/buy-tickets-zap.module'
import { GetAvailableStakesModule } from '../../use-cases/get-available-stakes.module'
import { GetCardCollectionModule } from '../../use-cases/get-card-collection.module'
import { GetCardDefinitionsModule } from '../../use-cases/get-card-definitions.module'
import { GetCompletedRoundsModule } from '../../use-cases/get-completed-rounds.module'
import { GetOngoingRoundsModule } from '../../use-cases/get-ongoing-rounds.module'
import { GetRipsStateModule } from '../../use-cases/get-rips-state.module'
import { GetRoundsModule } from '../../use-cases/get-rounds.module'
import { GetUnrevealedPrizesModule } from '../../use-cases/get-unrevealed-prizes.module'
import { GetZapResultModule } from '../../use-cases/get-zap-result.module'
import { QuotePurchaseModule } from '../../use-cases/quote-purchase.module'
import { QuoteZapModule } from '../../use-cases/quote-zap.module'
import { RevealTicketPrizesModule } from '../../use-cases/reveal-ticket-prizes.module'

@Module({
	imports: [
		PriceOracleModule.forRoot(Array.from(KNOWN_TOKENS.keys())),
		GetRoundsModule,
		GetAvailableStakesModule,
		GetRipsStateModule,
		GetOngoingRoundsModule,
		GetCompletedRoundsModule,
		BuyTicketsPurchaseModule,
		BuyTicketsZapModule,
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
