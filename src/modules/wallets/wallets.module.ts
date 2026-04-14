import { Module } from '@nestjs/common'
import { WalletsController } from '../../presentation/wallets/wallets.controller'
import { GetBalanceModule } from '../use-cases/get-balance.module'
import { GetUserModule } from '../use-cases/get-user.module'
import { WithdrawModule } from '../use-cases/withdraw.module'

@Module({
	imports: [GetUserModule, GetBalanceModule, WithdrawModule],
	controllers: [WalletsController],
})
export class WalletsModule {}
