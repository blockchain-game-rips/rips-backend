import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { GetBalanceService } from '../../application/use-cases/get-balance/get-balance.service'
import { GetBalanceUseCase } from '../../application/use-cases/get-balance/get-balance.use-case'
import { CurrencyModule } from '../../infrastructure/currency/currency.module'
import { WalletModule } from '../../infrastructure/wallet/wallet.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [
		CacheModule.register(),
		GetUserModule,
		WalletModule,
		CurrencyModule,
	],
	providers: [{ provide: GetBalanceUseCase, useClass: GetBalanceService }],
	exports: [GetBalanceUseCase],
})
export class GetBalanceModule {}
