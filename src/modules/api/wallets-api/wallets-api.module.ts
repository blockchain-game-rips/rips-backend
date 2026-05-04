import { Module } from '@nestjs/common'
import { CurrencyModule } from '../../../infrastructure/currency/currency.module'
import { WalletsController } from '../../../presentation/wallets/wallets.controller'
import { GetBalanceModule } from '../../use-cases/get-balance.module'
import { GetPriceModule } from '../../use-cases/get-price.module'
import { QuoteSwapModule } from '../../use-cases/quote-swap.module'
import { QuoteWithdrawModule } from '../../use-cases/quote-withdraw.module'
import { SwapModule } from '../../use-cases/swap.module'
import { WithdrawModule } from '../../use-cases/withdraw.module'

@Module({
	imports: [
		GetBalanceModule,
		GetPriceModule,
		WithdrawModule,
		QuoteWithdrawModule,
		QuoteSwapModule,
		SwapModule,
		CurrencyModule,
	],
	controllers: [WalletsController],
})
export class WalletsApiModule {}
