import { Module } from '@nestjs/common'
import { QuoteSwapService } from '../../application/use-cases/quote-swap/quote-swap.service'
import { QuoteSwapUseCase } from '../../application/use-cases/quote-swap/quote-swap.use-case'
import { WalletModule } from '../../infrastructure/wallet/wallet.module'
import { ZapModule } from '../../infrastructure/zap/zap.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, WalletModule, ZapModule],
	providers: [{ provide: QuoteSwapUseCase, useClass: QuoteSwapService }],
	exports: [QuoteSwapUseCase],
})
export class QuoteSwapModule {}
