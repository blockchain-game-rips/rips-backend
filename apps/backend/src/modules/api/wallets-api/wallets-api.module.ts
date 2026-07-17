import { Module } from '@nestjs/common'
import { CurrencyModule } from '../../../infrastructure/currency/currency.module'
import { WalletsController } from '../../../presentation/wallets/wallets.controller'
import { GetBalancesModule } from '../../use-cases/get-balances.module'
import { GetSwapResultModule } from '../../use-cases/get-swap-result.module'
import { QuoteSwapSamechainModule } from '../../use-cases/quote-swap-samechain.module'
import { QuoteSwapModule } from '../../use-cases/quote-swap.module'
import { QuoteWithdrawModule } from '../../use-cases/quote-withdraw.module'
import { SwapSamechainModule } from '../../use-cases/swap-samechain.module'
import { SwapModule } from '../../use-cases/swap.module'
import { WithdrawModule } from '../../use-cases/withdraw.module'

@Module({
	imports: [
		GetBalancesModule,
		WithdrawModule,
		QuoteWithdrawModule,
		QuoteSwapModule,
		QuoteSwapSamechainModule,
		SwapModule,
		SwapSamechainModule,
		GetSwapResultModule,
		CurrencyModule,
	],
	controllers: [WalletsController],
})
export class WalletsApiModule {}
