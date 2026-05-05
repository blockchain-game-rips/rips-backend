import { Module } from '@nestjs/common'
import { GetAdminWalletService } from '../../application/use-cases/get-admin-wallet/get-admin-wallet.service'
import { GetAdminWalletUseCase } from '../../application/use-cases/get-admin-wallet/get-admin-wallet.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
	imports: [PrismaModule],
	providers: [
		{ provide: GetAdminWalletUseCase, useClass: GetAdminWalletService },
	],
	exports: [GetAdminWalletUseCase],
})
export class GetAdminWalletModule {}
