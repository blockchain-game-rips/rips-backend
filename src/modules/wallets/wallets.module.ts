import { Module } from '@nestjs/common'
import { WalletsController } from '../../presentation/wallets/wallets.controller'
import { CurrencyModule } from '../currency/currency.module'
import { GetBalanceModule } from '../use-cases/get-balance.module'
import { GetPriceModule } from '../use-cases/get-price.module'
import { WithdrawModule } from '../use-cases/withdraw.module'

@Module({
	imports: [GetBalanceModule, GetPriceModule, WithdrawModule, CurrencyModule],
	controllers: [WalletsController],
})
export class WalletsModule {}
