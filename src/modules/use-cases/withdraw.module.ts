import { Module } from '@nestjs/common'
import { WithdrawService } from '../../application/use-cases/withdraw.ts/withdraw.service'
import { WithdrawUseCase } from '../../application/use-cases/withdraw.ts/withdraw.use-case'
import { WalletModule } from '../../infrastructure/wallet/wallet.module'
import { CurrencyModule } from '../currency/currency.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, WalletModule, CurrencyModule],
	providers: [{ provide: WithdrawUseCase, useClass: WithdrawService }],
	exports: [WithdrawUseCase],
})
export class WithdrawModule {}
