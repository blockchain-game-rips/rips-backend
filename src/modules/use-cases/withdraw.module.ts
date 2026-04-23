import { Module } from '@nestjs/common'
import { WithdrawService } from '../../application/use-cases/withdraw.ts/withdraw.service'
import { WithdrawUseCase } from '../../application/use-cases/withdraw.ts/withdraw.use-case'
import { CurrencyModule } from '../../infrastructure/currency/currency.module'
import { DeBridgeModule } from '../../infrastructure/de-bridge/de-bridge.module'
import { WalletModule } from '../../infrastructure/wallet/wallet.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, WalletModule, CurrencyModule, DeBridgeModule],
	providers: [{ provide: WithdrawUseCase, useClass: WithdrawService }],
	exports: [WithdrawUseCase],
})
export class WithdrawModule {}
