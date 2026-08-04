import { Module } from '@nestjs/common'
import { RipsController } from '../../../presentation/rips/rips.controller'
import { BuyEntriesPurchaseModule } from '../../use-cases/buy-entries-purchase.module'
import { BuyEntriesZapSamechainModule } from '../../use-cases/buy-entries-zap-samechain.module'
import { BuyEntriesZapModule } from '../../use-cases/buy-entries-zap.module'
import { GetAvailablePresetsModule } from '../../use-cases/get-available-presets.module'
import { GetCardCollectionModule } from '../../use-cases/get-card-collection.module'
import { GetCardDefinitionsModule } from '../../use-cases/get-card-definitions.module'
import { GetFinishedRipCountsModule } from '../../use-cases/get-finished-rip-counts.module'
import { GetFinishedRipsModule } from '../../use-cases/get-finished-rips.module'
import { GetOngoingRipsModule } from '../../use-cases/get-ongoing-rips.module'
import { GetPayoutsModule } from '../../use-cases/get-payouts.module'
import { GetRipsStateModule } from '../../use-cases/get-rips-state.module'
import { GetRipsModule } from '../../use-cases/get-rips.module'
import { GetZapResultModule } from '../../use-cases/get-zap-result.module'
import { QuotePurchaseModule } from '../../use-cases/quote-purchase.module'
import { QuoteZapSamechainModule } from '../../use-cases/quote-zap-samechain.module'
import { QuoteZapModule } from '../../use-cases/quote-zap.module'
import { RevealEntryPayoutsModule } from '../../use-cases/reveal-entry-payouts.module'

@Module({
	imports: [
		GetRipsModule,
		GetAvailablePresetsModule,
		GetRipsStateModule,
		GetOngoingRipsModule,
		GetFinishedRipsModule,
		GetFinishedRipCountsModule,
		BuyEntriesPurchaseModule,
		BuyEntriesZapModule,
		BuyEntriesZapSamechainModule,
		GetPayoutsModule,
		RevealEntryPayoutsModule,
		QuotePurchaseModule,
		QuoteZapModule,
		QuoteZapSamechainModule,
		GetZapResultModule,
		GetCardCollectionModule,
		GetCardDefinitionsModule,
	],
	controllers: [RipsController],
})
export class RipsApiModule {}
