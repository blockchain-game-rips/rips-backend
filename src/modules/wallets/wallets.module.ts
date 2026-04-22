import { Module } from '@nestjs/common'
import { WalletsController } from '../../presentation/wallets/wallets.controller'
import { GetBalanceModule } from '../use-cases/get-balance.module'
import { GetPriceModule } from '../use-cases/get-price.module'
import { WithdrawModule } from '../use-cases/withdraw.module'

@Module({
	imports: [GetBalanceModule, GetPriceModule, WithdrawModule],
	controllers: [WalletsController],
})
export class WalletsModule {}
