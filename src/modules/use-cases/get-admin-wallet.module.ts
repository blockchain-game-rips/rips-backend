import { Module } from '@nestjs/common'
import { GetAdminWalletService } from '../../application/use-cases/get-admin-wallet/get-admin-wallet.service'
import { GetAdminWalletUseCase } from '../../application/use-cases/get-admin-wallet/get-admin-wallet.use-case'
import { CurrencyModule } from '../../infrastructure/currency/currency.module'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { WalletModule } from '../../infrastructure/wallet/wallet.module'

@Module({
	imports: [PrismaModule, CurrencyModule, WalletModule],
	providers: [
		{ provide: GetAdminWalletUseCase, useClass: GetAdminWalletService },
	],
	exports: [GetAdminWalletUseCase],
})
export class GetAdminWalletModule {}
