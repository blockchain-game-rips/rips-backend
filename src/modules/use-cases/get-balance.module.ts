import { Module } from '@nestjs/common'
import { GetBalanceService } from 'src/application/use-cases/get-balance/get-balance.service'
import { GetBalanceUseCase } from 'src/application/use-cases/get-balance/get-balance.use-case'
import { WalletModule } from 'src/infrastructure/wallet/wallet.module'
import { MainCurrencyModule } from 'src/modules/main-currency/main-currency.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, WalletModule, MainCurrencyModule],
	providers: [{ provide: GetBalanceUseCase, useClass: GetBalanceService }],
	exports: [GetBalanceUseCase],
})
export class GetBalanceModule {}
