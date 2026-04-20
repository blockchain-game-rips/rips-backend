import { Module } from '@nestjs/common'
import { GetBalanceService } from '../../application/use-cases/get-balance/get-balance.service'
import { GetBalanceUseCase } from '../../application/use-cases/get-balance/get-balance.use-case'
import { WalletModule } from '../../infrastructure/wallet/wallet.module'
import { CurrencyModule } from '../currency/currency.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, WalletModule, CurrencyModule],
	providers: [{ provide: GetBalanceUseCase, useClass: GetBalanceService }],
	exports: [GetBalanceUseCase],
})
export class GetBalanceModule {}
