import { Module } from '@nestjs/common'
import { CurrencyModule } from '../../../infrastructure/currency/currency.module'
import { KNOWN_TOKENS } from '../../../infrastructure/evm/primitives/currencies/constants'
import { PriceOracleModule } from '../../../infrastructure/price-provider/price-provider.module'
import { WalletsController } from '../../../presentation/wallets/wallets.controller'
import { GetBalanceModule } from '../../use-cases/get-balance.module'
import { GetSwapResultModule } from '../../use-cases/get-swap-result.module'
import { QuoteSwapModule } from '../../use-cases/quote-swap.module'
import { QuoteWithdrawModule } from '../../use-cases/quote-withdraw.module'
import { SwapModule } from '../../use-cases/swap.module'
import { WithdrawModule } from '../../use-cases/withdraw.module'

@Module({
	imports: [
		PriceOracleModule.forRoot(Array.from(KNOWN_TOKENS.keys())),
		GetBalanceModule,
		WithdrawModule,
		QuoteWithdrawModule,
		QuoteSwapModule,
		SwapModule,
		GetSwapResultModule,
		CurrencyModule,
	],
	controllers: [WalletsController],
})
export class WalletsApiModule {}
