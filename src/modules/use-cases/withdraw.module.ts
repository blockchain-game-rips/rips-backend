import { Module } from '@nestjs/common'
import { WithdrawService } from 'src/application/use-cases/withdraw.ts/withdraw.service'
import { WithdrawUseCase } from 'src/application/use-cases/withdraw.ts/withdraw.use-case'
import { WalletModule } from 'src/infrastructure/wallet/wallet.module'
import { MainCurrencyModule } from 'src/modules/main-currency/main-currency.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, WalletModule, MainCurrencyModule],
	providers: [{ provide: WithdrawUseCase, useClass: WithdrawService }],
	exports: [WithdrawUseCase],
})
export class WithdrawModule {}
