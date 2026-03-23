import { Module } from '@nestjs/common'
import { GetBalanceModule } from 'src/modules/use-cases/get-balance.module'
import { GetUserModule } from 'src/modules/use-cases/get-user.module'
import { WithdrawModule } from 'src/modules/use-cases/withdraw.module'
import { WalletsController } from 'src/presentation/wallets/wallets.controller'

@Module({
	imports: [GetUserModule, GetBalanceModule, WithdrawModule],
	controllers: [WalletsController],
})
export class WalletsModule {}
