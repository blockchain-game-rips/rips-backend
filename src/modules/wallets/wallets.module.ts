import { Module } from '@nestjs/common'
import { WalletsController } from '../../presentation/wallets/wallets.controller'
import { CurrencyModule } from '../currency/currency.module'
import { GetBalanceModule } from '../use-cases/get-balance.module'
import { GetPriceModule } from '../use-cases/get-price.module'
import { QuoteSwapModule } from '../use-cases/quote-swap.module'
import { QuoteWithdrawModule } from '../use-cases/quote-withdraw.module'
import { SwapModule } from '../use-cases/swap.module'
import { WithdrawModule } from '../use-cases/withdraw.module'

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
export class WalletsModule {}
