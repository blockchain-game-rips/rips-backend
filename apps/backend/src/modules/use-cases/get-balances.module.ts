import { Module } from '@nestjs/common'
import { GetBalancesService } from '../../application/use-cases/get-balances/get-balances.service'
import { GetBalancesUseCase } from '../../application/use-cases/get-balances/get-balances.use-case'
import { CurrencyModule } from '../../infrastructure/currency/currency.module'
import { WalletModule } from '../../infrastructure/wallet/wallet.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, WalletModule, CurrencyModule],
	providers: [{ provide: GetBalancesUseCase, useClass: GetBalancesService }],
	exports: [GetBalancesUseCase],
})
export class GetBalancesModule {}
