import { Module } from '@nestjs/common'
import { QuoteWithdrawService } from '../../application/use-cases/quote-withdraw/quote-withdraw.service'
import { QuoteWithdrawUseCase } from '../../application/use-cases/quote-withdraw/quote-withdraw.use-case'
import { WalletModule } from '../../infrastructure/wallet/wallet.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, WalletModule],
	providers: [
		{ provide: QuoteWithdrawUseCase, useClass: QuoteWithdrawService },
	],
	exports: [QuoteWithdrawUseCase],
})
export class QuoteWithdrawModule {}
